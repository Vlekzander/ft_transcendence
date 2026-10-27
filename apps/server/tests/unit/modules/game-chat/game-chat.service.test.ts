import {
	startMatch,
	beginTurn,
	getMatch,
} from "@/modules/game/scoring.service";
import type { LobbyEntity } from "@/modules/lobby/lobby.mapper";
import { beforeEach, describe, expect, it } from "vitest";
import { CreateLobbySchema } from "@ft_transcendence/shared";
import { lobbyService, lobbiesByJoinCode } from "@/modules/lobby/lobby.service";
import { GameChatService } from "@/modules/game-chat/game-chat.service";

function setWord(room: LobbyEntity, word: string | null) {
	if (!word) {
		getMatch(room)!.turn = undefined;
		return;
	}
	room.connectedPlayers.add("drawer");
	room.drawerId = "drawer";
	room.selectedWord = word;
	room.gameStarted = true;
	room.gamePhase = "DRAWING";
	room.timerEndsAt = Date.now() + room.drawTime * 1000;
	if (!getMatch(room)) startMatch(room);
	beginTurn(room);
}
const defaults = CreateLobbySchema.parse({});
describe("game chat with real lobby membership", () => {
	let chat: GameChatService;
	beforeEach(() => {
		lobbiesByJoinCode.clear();
		chat = new GameChatService();
	});
	it("uses joined players and rejects outsiders, departed and banned players", async () => {
		const room = await lobbyService.createLobby("host", defaults);
		await lobbyService.joinLobby(room.uuid, "guest");
		expect(chat.submit(room.uuid, "guest", " hello ", "r1")).toMatchObject({
			type: "GAME_CHAT_MESSAGE",
			content: "hello",
			sender: "guest",
			roomId: room.uuid,
		});
		expect(() => chat.submit(room.uuid, "outsider", "hi", "r2")).toThrow(
			"not in this game",
		);
		await lobbyService.leaveLobby(room.uuid, "guest");
		expect(() => chat.submit(room.uuid, "guest", "hi", "r3")).toThrow();
		await lobbyService.joinLobby(room.uuid, "guest");
		await lobbyService.banLobby(room.uuid, "host", "guest");
		expect(chat.getPlayers(room.uuid)).toEqual(["host"]);
		expect(() => chat.submit(room.uuid, "guest", "hi", "r4")).toThrow();
	});
	it("rejects invalid content and accepts the exact length boundary", async () => {
		const room = await lobbyService.createLobby("host", defaults);
		for (const content of [null, 42, {}, "", "  ", "a".repeat(501)])
			expect(() =>
				chat.submit(room.uuid, "host", content, "r1"),
			).toThrow();
		expect(chat.submit(room.uuid, "host", "a".repeat(500), "r2").type).toBe(
			"GAME_CHAT_MESSAGE",
		);
	});
	it("blocks leaks and recognizes a normalized guess once per round without exposing the word", async () => {
		const room = await lobbyService.createLobby("host", defaults);
		setWord(room, "Chat");
		expect(() =>
			chat.submit(room.uuid, "host", "un CHAT ici", "r1"),
		).toThrow("round word");
		const guess = chat.submit(room.uuid, "host", " ＣＨＡＴ ", "r2");
		expect(guess.type).toBe("GAME_CHAT_GUESS");
		expect(guess).not.toHaveProperty("content");
		expect(() => chat.submit(room.uuid, "host", "chat", "r3")).toThrow(
			"already guessed",
		);
		setWord(room, "chat");
		expect(chat.submit(room.uuid, "host", "chat", "r4").type).toBe(
			"GAME_CHAT_GUESS",
		);
		setWord(room, null);
		expect(chat.submit(room.uuid, "host", "chat", "r5").type).toBe(
			"GAME_CHAT_MESSAGE",
		);
	});
	it("isolates round state and rejects deleted rooms", async () => {
		const a = await lobbyService.createLobby("a", defaults);
		const b = await lobbyService.createLobby("b", defaults);
		setWord(a, "chat");
		expect(chat.submit(b.uuid, "b", "chat", "r1").type).toBe(
			"GAME_CHAT_MESSAGE",
		);
		await lobbyService.deleteLobby(a.joinCode);
		expect(() => chat.submit(a.uuid, "a", "hi", "r2")).toThrow("not found");
	});
});
