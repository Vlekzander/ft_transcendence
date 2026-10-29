import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { WebSocket, type WebSocketServer } from "ws";
import { CreateLobbySchema, type AppPacket } from "@ft_transcendence/shared";
// Exercise real network sockets, registry and fanout; only auth and unrelated private-message DB are stubbed.
vi.mock("@/utils/jwt.util", () => ({
	validateAccessToken: (token: string) => ({ sub: token }),
}));
vi.mock("@/modules/msg/msg.socket", () => ({ registerMsgSockets: vi.fn() }));
import { setupWebSocketServer } from "@/websocket.server";
import { lobbyService, lobbiesByJoinCode } from "@/modules/lobby/lobby.service";
import { startMatch, beginTurn } from "@/modules/game/scoring.service";
import { stopRoundTimer } from "@/modules/lobby/game.socket";

const defaults = CreateLobbySchema.parse({});
describe("game chat WebSocket delivery", () => {
	let server: Server;
	let wss: WebSocketServer;
	let url: string;
	const clients: WebSocket[] = [];
	beforeEach(async () => {
		lobbiesByJoinCode.clear();
		server = createServer();
		wss = setupWebSocketServer(server);
		await new Promise<void>((resolve) =>
			server.listen(0, "127.0.0.1", resolve),
		);
		url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}`;
	});
	afterEach(async () => {
		for (const room of lobbiesByJoinCode.values())
			stopRoundTimer(room.uuid);
		for (const ws of clients.splice(0)) ws.terminate();
		for (const ws of wss.clients) ws.terminate();
		await new Promise<void>((resolve) => wss.close(() => resolve()));
		await new Promise<void>((resolve) => server.close(() => resolve()));
	});
	async function connect(user?: string) {
		const ws = new WebSocket(url, {
			headers: user ? { Cookie: `token=${user}` } : {},
		});
		clients.push(ws);
		const packets: AppPacket[] = [];
		ws.on("message", (data) => packets.push(JSON.parse(data.toString())));
		await new Promise<void>((resolve, reject) => {
			ws.once("open", resolve);
			ws.once("error", reject);
		});
		return { ws, packets };
	}
	it("delivers to both players only; leaving and banning revoke send/receive access", async () => {
		const room = await lobbyService.createLobby("host", defaults);
		await lobbyService.joinLobby(room.uuid, "guest");
		await lobbyService.createLobby("other", defaults);
		const host = await connect("host"),
			guest = await connect("guest"),
			other = await connect("other"),
			anonymous = await connect();
		const send = (ws: WebSocket, content: string) =>
			ws.send(
				JSON.stringify({
					type: "SEND_GAME_CHAT",
					roomId: room.uuid,
					content,
					requestId: content,
				}),
			);
		send(host.ws, "hello");
		await vi.waitFor(() => expect(guest.packets).toHaveLength(1));
		expect(host.packets[0]).toMatchObject({
			type: "GAME_CHAT_MESSAGE",
			sender: "host",
			content: "hello",
		});
		expect(other.packets).toEqual([]);
		expect(anonymous.packets).toEqual([]);
		send(guest.ws, "reply");
		await vi.waitFor(() => expect(host.packets).toHaveLength(2));
		expect(host.packets[1]).toMatchObject({
			sender: "guest",
			content: "reply",
		});
		await lobbyService.banLobby(room.uuid, "host", "guest");
		send(guest.ws, "blocked");
		await vi.waitFor(() =>
			expect(guest.packets.at(-1)?.type).toBe("GAME_CHAT_ERROR"),
		);
		const count = guest.packets.length;
		send(host.ws, "private");
		await vi.waitFor(() => expect(host.packets).toHaveLength(3));
		expect(guest.packets).toHaveLength(count);
		expect(other.packets).toEqual([]);
		send(anonymous.ws, "anon");
		await vi.waitFor(() =>
			expect(anonymous.packets[0]).toMatchObject({
				type: "GAME_CHAT_ERROR",
				text: "Authentication required",
			}),
		);
		await lobbyService.unbanLobby(room.uuid, "host", "guest");
		await lobbyService.joinLobby(room.uuid, "guest");
		await lobbyService.leaveLobby(room.uuid, "guest");
		send(guest.ws, "left");
		await vi.waitFor(() =>
			expect(guest.packets.at(-1)).toMatchObject({
				type: "GAME_CHAT_ERROR",
				requestId: "left",
			}),
		);
	});
	it("rejects malformed chat packets through the shared validator without broadcasting", async () => {
		const room = await lobbyService.createLobby("host", defaults);
		await lobbyService.joinLobby(room.uuid, "guest");
		const host = await connect("host"),
			guest = await connect("guest");
		for (const content of ["", "   ", "x".repeat(501), 42]) {
			const before = host.packets.length;
			host.ws.send(
				JSON.stringify({
					type: "SEND_GAME_CHAT",
					roomId: room.uuid,
					requestId: "invalid",
					content,
				}),
			);
			await vi.waitFor(() =>
				expect(host.packets).toHaveLength(before + 1),
			);
			expect(host.packets.at(-1)?.type).toBe("ERROR");
		}
		expect(guest.packets).toEqual([]);
	});
	it("keeps rejected content private and broadcasts guesses without the secret", async () => {
		const room = await lobbyService.createLobby("host", defaults);
		await lobbyService.joinLobby(room.uuid, "guest");
		const host = await connect("host"),
			guest = await connect("guest");
		room.gameStarted = true;
		room.gamePhase = "DRAWING";
		room.drawerIds = ["host"];
		room.selectedWord = "chat";
		room.timerEndsAt = Date.now() + room.drawTime * 1000;
		startMatch(room);
		beginTurn(room);
		guest.ws.send(
			JSON.stringify({
				type: "SEND_GAME_CHAT",
				roomId: room.uuid,
				requestId: "leak",
				content: "un chat",
			}),
		);
		await vi.waitFor(() =>
			expect(guest.packets[0]?.type).toBe("GAME_CHAT_ERROR"),
		);
		expect(host.packets).toEqual([]);
		guest.ws.send(
			JSON.stringify({
				type: "SEND_GAME_CHAT",
				roomId: room.uuid,
				requestId: "guess",
				content: "CHAT",
			}),
		);
		await vi.waitFor(() =>
			expect(host.packets[0]?.type).toBe("GAME_CHAT_GUESS"),
		);
		expect(host.packets[0]).not.toHaveProperty("content");
		expect(guest.packets.find((p) => p.type === "GAME_CHAT_GUESS")).toEqual(
			host.packets[0],
		);
	});
});
