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

const JWT_SECRET = "websocket-test-secret";

function waitForOpen(socket: WebSocket): Promise<void> {
	return new Promise((resolve, reject) => {
		socket.once("open", () => {
			resolve();
		});

		socket.once("error", (error) => {
			reject(error);
		});
	});
}

function waitForMessage(socket: WebSocket): Promise<string> {
	return new Promise((resolve, reject) => {
		socket.once("message", (data) => {
			resolve(data.toString());
		});

		socket.once("error", (error) => {
			reject(error);
		});
	});
}

function waitForClose(socket: WebSocket): Promise<void> {
	return new Promise((resolve) => {
		socket.once("close", () => {
			resolve();
		});
	});
}

describe("websocket server", () => {
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
		it("Returns false for a user without an active socket", () => {
			// Arrange
			const uuid = "offline-user-uuid";

			// Act
			const result = isUserOnline(uuid);

			// Assert
			expect(result).toBe(false);
		});

		it("Returns an empty list when no user is connected", () => {
			// Arrange
			// No socket is connected.

			// Act
			const result = getOnlineUsers();

			// Assert
			expect(result).toEqual([]);
		});

		it("Marks an authenticated user as online after connection", async () => {
			// Arrange
			const uuid = "user-uuid";
			const token = generateAccessToken(uuid);

			const socket = new WebSocket(address, {
				headers: {
					Cookie: `token=${token}`,
				},
			});

			// Act
			await waitForOpen(socket);

			// Assert
			expect(isUserOnline(uuid)).toBe(true);
			expect(getOnlineUsers()).toContain(uuid);

			socket.close();
			await waitForClose(socket);
		});

		it("Reads an authentication token after another cookie", async () => {
			// Arrange
			const uuid = "user-uuid";
			const token = generateAccessToken(uuid);

			const socket = new WebSocket(address, {
				headers: {
					Cookie: `theme=dark; token=${token}`,
				},
			});

			// Act
			await waitForOpen(socket);

			// Assert
			expect(isUserOnline(uuid)).toBe(true);
			expect(getOnlineUsers()).toContain(uuid);

			socket.close();
			await waitForClose(socket);
		});

		it("Does not mark an unauthenticated client as online", async () => {
			// Arrange
			const uuid = "user-uuid";
			const socket = new WebSocket(address);

			// Act
			await waitForOpen(socket);

			// Assert
			expect(isUserOnline(uuid)).toBe(false);
			expect(getOnlineUsers()).not.toContain(uuid);

			socket.close();
			await waitForClose(socket);
		});

		it("Does not mark an invalid token as online", async () => {
			// Arrange
			const socket = new WebSocket(address, {
				headers: {
					Cookie: "token=invalid-token",
				},
			});

			// Act
			const messagePromise = waitForMessage(socket);

			await waitForOpen(socket);

			const message = await messagePromise;

			// Assert
			const errorPacket = JSON.parse(message);

			expect(errorPacket).toMatchObject({
				type: "ERROR",
			});

			expect(getOnlineUsers()).toEqual([]);

			socket.close();
			await waitForClose(socket);
		});

		it("Keeps the user online while another socket remains connected", async () => {
			// Arrange
			const uuid = "user-uuid";
			const token = generateAccessToken(uuid);

			const firstSocket = new WebSocket(address, {
				headers: {
					Cookie: `token=${token}`,
				},
			});

			const secondSocket = new WebSocket(address, {
				headers: {
					Cookie: `token=${token}`,
				},
			});

			await waitForOpen(firstSocket);
			await waitForOpen(secondSocket);

			// Act
			firstSocket.close();
			await waitForClose(firstSocket);

			// Assert
			expect(isUserOnline(uuid)).toBe(true);

			secondSocket.close();
			await waitForClose(secondSocket);
		});

		it("Marks the user as offline after the last socket closes", async () => {
			// Arrange
			const uuid = "user-uuid";
			const token = generateAccessToken(uuid);

			const firstSocket = new WebSocket(address, {
				headers: {
					Cookie: `token=${token}`,
				},
			});

			const secondSocket = new WebSocket(address, {
				headers: {
					Cookie: `token=${token}`,
				},
			});

			await waitForOpen(firstSocket);
			await waitForOpen(secondSocket);

			// Act
			firstSocket.close();
			await waitForClose(firstSocket);

			secondSocket.close();
			await waitForClose(secondSocket);

			// Assert
			expect(isUserOnline(uuid)).toBe(false);
			expect(getOnlineUsers()).not.toContain(uuid);
		});
	});

	describe("messages", () => {
		it("Returns an error packet for invalid JSON", async () => {
			// Arrange
			const socket = new WebSocket(address);

			await waitForOpen(socket);

			// Act
			socket.send("{invalid-json");

			const message = await waitForMessage(socket);

			// Assert
			const errorPacket = JSON.parse(message);

			expect(errorPacket).toMatchObject({
				type: "ERROR",
			});
			expect(errorPacket.text).toEqual(expect.any(String));

			socket.close();
			await waitForClose(socket);
		});

		it("Returns an error packet for an unknown packet type", async () => {
			// Arrange
			const socket = new WebSocket(address);

			await waitForOpen(socket);

			const packet = {
				type: "UNKNOWN",
			};

			// Act
			socket.send(JSON.stringify(packet));

			const message = await waitForMessage(socket);

			// Assert
			const errorPacket = JSON.parse(message);

			expect(errorPacket).toMatchObject({
				type: "ERROR",
				text: "Unknown packet type: UNKNOWN",
			});

			socket.close();
			await waitForClose(socket);
		});
	});
});
