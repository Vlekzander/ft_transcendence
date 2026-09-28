import { createServer, Server } from "node:http";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import WebSocket from "ws";
import {
	getOnlineUsers,
	isUserOnline,
	setupWebSocketServer,
} from "@/websocket.server";
import { generateAccessToken } from "@/utils/jwt.util";
import { msgService } from "@/modules/msg/msg.service";

vi.mock("@/modules/msg/msg.service", () => ({
	msgService: {
		sendMessage: vi.fn(),
		getConversation: vi.fn(),
	},
}));

const mockedSendMessage = vi.mocked(msgService.sendMessage);
const JWT_SECRET = "websocket-test-secret";

function waitForOpen(socket: WebSocket): Promise<void> {
	return new Promise((resolve, reject) => {
		socket.once("open", () => resolve());
		socket.once("error", (error) => reject(error));
	});
}

function waitForMessage(socket: WebSocket): Promise<string> {
	return new Promise((resolve, reject) => {
		socket.once("message", (data) => resolve(data.toString()));
		socket.once("error", (error) => reject(error));
	});
}

function waitForClose(socket: WebSocket): Promise<void> {
	return new Promise((resolve) => {
		socket.once("close", () => resolve());
	});
}

describe("websocket server (integration)", () => {
	let httpServer: Server;
	let address: string;

	beforeAll(async () => {
		process.env.JWT_SECRET = JWT_SECRET;
		httpServer = createServer();
		setupWebSocketServer(httpServer);

		await new Promise<void>((resolve) => {
			httpServer.listen(0, "127.0.0.1", resolve);
		});

		const serverAddress = httpServer.address();
		if (!serverAddress || typeof serverAddress === "string") {
			throw new Error("WebSocket test server address is unavailable");
		}

		address = `ws://127.0.0.1:${serverAddress.port}`;
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(async () => {
		await new Promise<void>((resolve, reject) => {
			httpServer.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	});

	describe("presence", () => {
		it("returns false for a user without an active socket", () => {
			expect(isUserOnline("offline-user-uuid")).toBe(false);
		});

		it("returns an empty list when no user is connected", () => {
			expect(getOnlineUsers()).toEqual([]);
		});

		it("marks an authenticated user as online after connection", async () => {
			const uuid = "user-uuid";
			const token = generateAccessToken(uuid);

			const socket = new WebSocket(address, {
				headers: { Cookie: `token=${token}` },
			});

			await waitForOpen(socket);

			expect(isUserOnline(uuid)).toBe(true);
			expect(getOnlineUsers()).toContain(uuid);

			socket.close();
			await waitForClose(socket);
		});

		it("reads an authentication token positioned after another cookie", async () => {
			const uuid = "user-uuid-multi-cookie";
			const token = generateAccessToken(uuid);

			const socket = new WebSocket(address, {
				headers: { Cookie: `theme=dark; token=${token}` },
			});

			await waitForOpen(socket);

			expect(isUserOnline(uuid)).toBe(true);
			expect(getOnlineUsers()).toContain(uuid);

			socket.close();
			await waitForClose(socket);
		});

		it("does not mark an unauthenticated client as online", async () => {
			const socket = new WebSocket(address);

			await waitForOpen(socket);

			expect(getOnlineUsers()).toEqual([]);

			socket.close();
			await waitForClose(socket);
		});

		it("does not mark a socket with an invalid token as online and receives error packet", async () => {
			const socket = new WebSocket(address, {
				headers: { Cookie: "token=invalid-corrupted-jwt" },
			});

			const messagePromise = waitForMessage(socket);
			await waitForOpen(socket);
			const rawMessage = await messagePromise;

			const packet = JSON.parse(rawMessage);
			expect(packet).toMatchObject({ type: "ERROR" });
			expect(getOnlineUsers()).toEqual([]);

			socket.close();
			await waitForClose(socket);
		});

		it("keeps the user online while at least one socket remains connected across multiple tabs", async () => {
			const uuid = "multi-tab-user";
			const token = generateAccessToken(uuid);

			const tab1 = new WebSocket(address, {
				headers: { Cookie: `token=${token}` },
			});
			const tab2 = new WebSocket(address, {
				headers: { Cookie: `token=${token}` },
			});

			await Promise.all([waitForOpen(tab1), waitForOpen(tab2)]);
			expect(isUserOnline(uuid)).toBe(true);

			tab1.close();
			await waitForClose(tab1);

			expect(isUserOnline(uuid)).toBe(true);
			expect(getOnlineUsers()).toContain(uuid);

			tab2.close();
			await waitForClose(tab2);

			expect(isUserOnline(uuid)).toBe(false);
			expect(getOnlineUsers()).not.toContain(uuid);
		});
	});

	describe("messages & edge cases", () => {
		it("returns an error packet for invalid JSON", async () => {
			const socket = new WebSocket(address);
			await waitForOpen(socket);

			const messagePromise = waitForMessage(socket);
			socket.send("{malformed-json");
			const message = await messagePromise;

			const errorPacket = JSON.parse(message);
			expect(errorPacket).toMatchObject({
				type: "ERROR",
				text: expect.any(String),
			});

			socket.close();
			await waitForClose(socket);
		});

		it("returns an error packet for an unknown packet type", async () => {
			const socket = new WebSocket(address);
			await waitForOpen(socket);

			const messagePromise = waitForMessage(socket);
			socket.send(JSON.stringify({ type: "UNKNOWN_TYPE" }));
			const message = await messagePromise;

			const errorPacket = JSON.parse(message);
			expect(errorPacket).toMatchObject({
				type: "ERROR",
				text: "Unknown packet type: UNKNOWN_TYPE",
			});

			socket.close();
			await waitForClose(socket);
		});

		it("broadcasts message to both sender and receiver when both are online", async () => {
			const senderUuid = "sender-online";
			const receiverUuid = "receiver-online";

			const senderSocket = new WebSocket(address, {
				headers: { Cookie: `token=${generateAccessToken(senderUuid)}` },
			});
			const receiverSocket = new WebSocket(address, {
				headers: {
					Cookie: `token=${generateAccessToken(receiverUuid)}`,
				},
			});

			await Promise.all([
				waitForOpen(senderSocket),
				waitForOpen(receiverSocket),
			]);

			mockedSendMessage.mockResolvedValue({
				uuid: "msg-123",
				senderId: senderUuid,
				receiverId: receiverUuid,
				content: "Hello friend!",
				createdAt: new Date(),
			} as any);

			const senderMessagePromise = waitForMessage(senderSocket);
			const receiverMessagePromise = waitForMessage(receiverSocket);

			senderSocket.send(
				JSON.stringify({
					type: "SEND_MESSAGE",
					receiver: receiverUuid,
					content: "Hello friend!",
				}),
			);

			const [senderRaw, receiverRaw] = await Promise.all([
				senderMessagePromise,
				receiverMessagePromise,
			]);

			const expectedPayload = {
				type: "RECEIVE_MESSAGE",
				uuid: "msg-123",
				sender: senderUuid,
				content: "Hello friend!",
			};

			expect(JSON.parse(senderRaw)).toMatchObject(expectedPayload);
			expect(JSON.parse(receiverRaw)).toMatchObject(expectedPayload);

			senderSocket.close();
			receiverSocket.close();
			await Promise.all([
				waitForClose(senderSocket),
				waitForClose(receiverSocket),
			]);
		});

		it("delivers packet to all connected tabs/sockets of the same user", async () => {
			const senderUuid = "sender-multi-device";
			const receiverUuid = "receiver-multi-device";

			const senderSocket = new WebSocket(address, {
				headers: { Cookie: `token=${generateAccessToken(senderUuid)}` },
			});
			const receiverTab1 = new WebSocket(address, {
				headers: {
					Cookie: `token=${generateAccessToken(receiverUuid)}`,
				},
			});
			const receiverTab2 = new WebSocket(address, {
				headers: {
					Cookie: `token=${generateAccessToken(receiverUuid)}`,
				},
			});

			await Promise.all([
				waitForOpen(senderSocket),
				waitForOpen(receiverTab1),
				waitForOpen(receiverTab2),
			]);

			mockedSendMessage.mockResolvedValue({
				uuid: "msg-tab",
				senderId: senderUuid,
				receiverId: receiverUuid,
				content: "Multi-tab sync",
				createdAt: new Date(),
			} as any);

			const p1 = waitForMessage(receiverTab1);
			const p2 = waitForMessage(receiverTab2);

			senderSocket.send(
				JSON.stringify({
					type: "SEND_MESSAGE",
					receiver: receiverUuid,
					content: "Multi-tab sync",
				}),
			);

			const [raw1, raw2] = await Promise.all([p1, p2]);
			expect(JSON.parse(raw1)).toMatchObject({
				type: "RECEIVE_MESSAGE",
				content: "Multi-tab sync",
			});
			expect(JSON.parse(raw2)).toMatchObject({
				type: "RECEIVE_MESSAGE",
				content: "Multi-tab sync",
			});

			senderSocket.close();
			receiverTab1.close();
			receiverTab2.close();
			await Promise.all([
				waitForClose(senderSocket),
				waitForClose(receiverTab1),
				waitForClose(receiverTab2),
			]);
		});

		it("persists message and only sends response to sender when receiver is offline", async () => {
			const senderUuid = "sender-offline-target";
			const receiverUuid = "offline-target";

			const senderSocket = new WebSocket(address, {
				headers: { Cookie: `token=${generateAccessToken(senderUuid)}` },
			});

			await waitForOpen(senderSocket);

			mockedSendMessage.mockResolvedValue({
				uuid: "msg-offline",
				senderId: senderUuid,
				receiverId: receiverUuid,
				content: "Are you there?",
				createdAt: new Date(),
			} as any);

			const senderPromise = waitForMessage(senderSocket);

			senderSocket.send(
				JSON.stringify({
					type: "SEND_MESSAGE",
					receiver: receiverUuid,
					content: "Are you there?",
				}),
			);

			const senderRaw = await senderPromise;
			expect(JSON.parse(senderRaw)).toMatchObject({
				type: "RECEIVE_MESSAGE",
				uuid: "msg-offline",
			});
			expect(mockedSendMessage).toHaveBeenCalledWith(
				senderUuid,
				receiverUuid,
				"Are you there?",
			);

			senderSocket.close();
			await waitForClose(senderSocket);
		});

		it("returns an error packet when the database/service layer throws", async () => {
			const senderUuid = "sender-db-error";
			const senderSocket = new WebSocket(address, {
				headers: { Cookie: `token=${generateAccessToken(senderUuid)}` },
			});

			await waitForOpen(senderSocket);

			mockedSendMessage.mockRejectedValue(
				new Error("Database connection lost"),
			);

			const messagePromise = waitForMessage(senderSocket);

			senderSocket.send(
				JSON.stringify({
					type: "SEND_MESSAGE",
					receiver: "target-user",
					content: "Crash test",
				}),
			);

			const rawResponse = await messagePromise;
			const errorPacket = JSON.parse(rawResponse);

			expect(errorPacket).toMatchObject({
				type: "ERROR",
				text: "Database connection lost",
			});

			senderSocket.close();
			await waitForClose(senderSocket);
		});

		it("rejects unauthenticated message sending attempts", async () => {
			const socket = new WebSocket(address);
			await waitForOpen(socket);

			const messagePromise = waitForMessage(socket);
			socket.send(
				JSON.stringify({
					type: "SEND_MESSAGE",
					receiver: "some-receiver",
					content: "Unauthorized attempt",
				}),
			);

			const rawResponse = await messagePromise;
			expect(JSON.parse(rawResponse)).toMatchObject({ type: "ERROR" });
			expect(mockedSendMessage).not.toHaveBeenCalled();

			socket.close();
			await waitForClose(socket);
		});

		it("rejects self-messaging attempts", async () => {
			const userUuid = "self-talker";
			const socket = new WebSocket(address, {
				headers: { Cookie: `token=${generateAccessToken(userUuid)}` },
			});

			await waitForOpen(socket);

			const messagePromise = waitForMessage(socket);
			socket.send(
				JSON.stringify({
					type: "SEND_MESSAGE",
					receiver: userUuid,
					content: "Talking to myself",
				}),
			);

			const rawResponse = await messagePromise;
			expect(JSON.parse(rawResponse)).toMatchObject({ type: "ERROR" });
			expect(mockedSendMessage).not.toHaveBeenCalled();

			socket.close();
			await waitForClose(socket);
		});
	});

	describe("heartbeat & ping/pong protocol", () => {
		it("answers ping frames with pong responses", async () => {
			const socket = new WebSocket(address);
			await waitForOpen(socket);

			const pongReceived = new Promise<void>((resolve) => {
				socket.once("pong", () => resolve());
			});

			socket.ping();

			await expect(pongReceived).resolves.toBeUndefined();

			socket.close();
			await waitForClose(socket);
		});
	});
});
