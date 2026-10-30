import { assertTestDatabase } from "./database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { WebSocket, type WebSocketServer } from "ws";
import { CreateLobbySchema, type AppPacket } from "@ft_transcendence/shared";
import { prisma } from "@/lib/prisma.lib";
import { generateAccessToken } from "@/utils/jwt.util";
import { setupWebSocketServer, isUserOnline } from "@/websocket.server";
import { lobbyService, lobbiesByJoinCode } from "@/modules/lobby/lobby.service";
import { startMatch, beginTurn } from "@/modules/game/scoring.service";
import { stopRoundTimer } from "@/modules/lobby/game.socket";

const HOST = "00000000-0000-4000-8000-000000000011";
const GUEST = "00000000-0000-4000-8000-000000000012";
const OTHER = "00000000-0000-4000-8000-000000000013";
const SPEC = "00000000-0000-4000-8000-000000000014";
const defaults = CreateLobbySchema.parse({});
describe("game chat WebSocket delivery", () => {
	let server: Server;
	let wss: WebSocketServer;
	let url: string;
	const clients: WebSocket[] = [];
	beforeEach(async () => {
		lobbiesByJoinCode.clear();
		assertTestDatabase();
		await prisma.user.deleteMany();
		await prisma.user.createMany({
			data: [HOST, GUEST, OTHER, SPEC].map((uuid, i) => ({
				uuid,
				username: "chat" + i,
				email: "chat" + i + "@test.local",
				password: "unused",
			})),
		});
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
		await prisma.$disconnect();
	});
	async function connect(user?: string) {
		const ws = new WebSocket(url, {
			headers: user
				? { Cookie: `token=${generateAccessToken(user)}` }
				: {},
		});
		clients.push(ws);
		const packets: AppPacket[] = [];
		ws.on("message", (data) => packets.push(JSON.parse(data.toString())));
		await new Promise<void>((resolve, reject) => {
			ws.once("open", resolve);
			ws.once("error", reject);
		});
		if (user) await vi.waitFor(() => expect(isUserOnline(user)).toBe(true));
		return { ws, packets };
	}
	it("does not let a deactivated account send messages with an old valid JWT", async () => {
		const room = await lobbyService.createLobby(HOST, defaults);
		await lobbyService.joinLobby(room.uuid, GUEST);
		const host = await connect(HOST);
		await prisma.user.update({
			where: { uuid: GUEST },
			data: { isActive: false },
		});
		const ws = new WebSocket(url, {
			headers: { Cookie: `token=${generateAccessToken(GUEST)}` },
		});
		clients.push(ws);
		const packets: AppPacket[] = [];
		ws.on("message", (data) => packets.push(JSON.parse(data.toString())));
		await new Promise<void>((resolve, reject) => {
			ws.once("open", resolve);
			ws.once("error", reject);
		});
		ws.send(
			JSON.stringify({
				type: "SEND_GAME_CHAT",
				roomId: room.uuid,
				requestId: "disabled",
				content: "must not reach host",
			}),
		);
		await vi.waitFor(() =>
			expect(packets.some((p) => p.type === "GAME_CHAT_ERROR")).toBe(
				true,
			),
		);
		expect(host.packets).toEqual([]);
		expect(isUserOnline(GUEST)).toBe(false);
	});

	it("revokes an already connected account when it is deactivated", async () => {
		const room = await lobbyService.createLobby(HOST, defaults);
		await lobbyService.joinLobby(room.uuid, GUEST);
		const host = await connect(HOST),
			guest = await connect(GUEST);
		await prisma.user.update({
			where: { uuid: GUEST },
			data: { isActive: false },
		});
		guest.ws.send(
			JSON.stringify({
				type: "SEND_GAME_CHAT",
				roomId: room.uuid,
				requestId: "revoked",
				content: "blocked",
			}),
		);
		await vi.waitFor(() =>
			expect(guest.packets.at(-1)).toMatchObject({
				type: "ERROR",
				text: "Authentication required",
			}),
		);
		expect(host.packets).toEqual([]);
		expect(isUserOnline(GUEST)).toBe(false);
	});

	it("isolates spectator chat, while delivering player messages to spectators and all player tabs", async () => {
		const room = await lobbyService.createLobby(HOST, defaults);
		await lobbyService.joinLobby(room.uuid, GUEST);
		await lobbyService.joinLobby(room.uuid, SPEC);
		room.spectatorPlayers.add(SPEC);
		const host = await connect(HOST),
			secondTab = await connect(HOST),
			guest = await connect(GUEST),
			spectator = await connect(SPEC);
		spectator.ws.send(
			JSON.stringify({
				type: "SEND_GAME_CHAT",
				roomId: room.uuid,
				requestId: "spec",
				content: "spectators only",
			}),
		);
		await vi.waitFor(() => expect(spectator.packets).toHaveLength(1));
		expect(host.packets).toEqual([]);
		expect(secondTab.packets).toEqual([]);
		expect(guest.packets).toEqual([]);
		host.ws.send(
			JSON.stringify({
				type: "SEND_GAME_CHAT",
				roomId: room.uuid,
				requestId: "player",
				content: "everyone",
			}),
		);
		await vi.waitFor(() => {
			expect(host.packets).toHaveLength(1);
			expect(secondTab.packets).toEqual(host.packets);
			expect(guest.packets).toEqual(host.packets);
			expect(spectator.packets).toHaveLength(2);
		});
	});

	it("delivers to both players only; leaving and banning revoke send/receive access", async () => {
		const room = await lobbyService.createLobby(HOST, defaults);
		await lobbyService.joinLobby(room.uuid, GUEST);
		await lobbyService.createLobby(OTHER, defaults);
		const host = await connect(HOST),
			guest = await connect(GUEST),
			other = await connect(OTHER),
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
			sender: HOST,
			content: "hello",
		});
		expect(other.packets).toEqual([]);
		expect(anonymous.packets).toEqual([]);
		send(guest.ws, "reply");
		await vi.waitFor(() => expect(host.packets).toHaveLength(2));
		expect(host.packets[1]).toMatchObject({
			sender: GUEST,
			content: "reply",
		});
		await lobbyService.banLobby(room.uuid, HOST, GUEST);
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
		await lobbyService.unbanLobby(room.uuid, HOST, GUEST);
		await lobbyService.joinLobby(room.uuid, GUEST);
		await lobbyService.leaveLobby(room.uuid, GUEST);
		send(guest.ws, "left");
		await vi.waitFor(() =>
			expect(guest.packets.at(-1)).toMatchObject({
				type: "GAME_CHAT_ERROR",
				requestId: "left",
			}),
		);
	});
	it("rejects malformed chat packets through the shared validator without broadcasting", async () => {
		const room = await lobbyService.createLobby(HOST, defaults);
		await lobbyService.joinLobby(room.uuid, GUEST);
		const host = await connect(HOST),
			guest = await connect(GUEST);
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
		const room = await lobbyService.createLobby(HOST, defaults);
		await lobbyService.joinLobby(room.uuid, GUEST);
		const host = await connect(HOST),
			guest = await connect(GUEST);
		room.gameStarted = true;
		room.gamePhase = "DRAWING";
		room.drawerIds = [HOST];
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
