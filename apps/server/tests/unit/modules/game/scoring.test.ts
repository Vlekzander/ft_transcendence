import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { CreateLobbySchema } from "@ft_transcendence/shared";
import { LobbyService, lobbiesByJoinCode } from "@/modules/lobby/lobby.service";
import {
	startMatch,
	beginTurn,
	getMatch,
	guessWord,
	settleTurn,
	saveMatch,
	calculateTurn,
} from "@/modules/game/scoring.service";
import { GameChatService } from "@/modules/game-chat/game-chat.service";
import { NotEnoughReadyPlayersError } from "@/errors";

const service = new LobbyService();
const defaults = CreateLobbySchema.parse({});
async function drawing() {
	const room = await service.createLobby("drawer", defaults);
	await service.joinLobby(room.uuid, "a");
	await service.joinLobby(room.uuid, "b");
	room.readyPlayers = new Set(["drawer", "a", "b"]);
	await service.toggleGame(room.uuid, "drawer");
	room.drawerIds = ["drawer"];
	room.gamePhase = "DRAWING";
	room.selectedWord = "chat";
	room.timerEndsAt = Date.now() + 60000;
	room.drawTime = 60;
	beginTurn(room);
	return room;
}
beforeEach(() => {
	lobbiesByJoinCode.clear();
	vi.useFakeTimers();
	vi.setSystemTime(100000);
});
afterEach(() => vi.useRealTimers());
describe("server scoring", () => {
	it("does not grant a new drawing period when resuming an expired timer", async () => {
		const room = await drawing();
		vi.advanceTimersByTime(60000);
		await service.toggleGame(room.uuid, "drawer");
		await service.toggleGame(room.uuid, "drawer");
		expect(room.timerEndsAt).toBe(Date.now());
		expect(() => guessWord(room, "a", "chat")).toThrow("not accepting");
	});

	it("awards faster guessers more and settles once only", async () => {
		const room = await drawing();
		vi.advanceTimersByTime(10000);
		expect(guessWord(room, "a", "CHAT")).toBe(true);
		vi.advanceTimersByTime(20000);
		guessWord(room, "b", "chat");
		expect([...getMatch(room)!.scores.values()]).toEqual([0, 0, 0]);
		settleTurn(room);
		const scores = Object.fromEntries(getMatch(room)!.scores);
		expect(scores).toEqual({ drawer: 750, a: 817, b: 650 });
		settleTurn(room);
		expect(Object.fromEntries(getMatch(room)!.scores)).toEqual(scores);
	});
	it("uses both success ratio and total turn duration; zero guesses means zero points", () => {
		const turn = {
			drawers: ["d"],
			word: "w",
			eligible: ["a", "b"],
			guesses: new Map([["a", 10000]]),
			durationMs: 60000,
			settled: false,
		};
		const partial = calculateTurn(turn, 60000);
		const full = calculateTurn(
			{
				...turn,
				guesses: new Map([
					["a", 10000],
					["b", 30000],
				]),
			},
			30000,
		);
		expect(partial).toEqual({ a: 617, d: 250 });
		expect(full.a).toBeGreaterThan(partial.a);
		expect(full.d).toBeGreaterThan(partial.d);
		expect(calculateTurn({ ...turn, guesses: new Map() }, 60000)).toEqual({
			d: 0,
		});
	});
	it("rejects duplicate, late, drawer, spectator guesses and leaked phrases", async () => {
		const room = await drawing(),
			chat = new GameChatService();
		expect(() => chat.submit(room.uuid, "drawer", "chat", "1")).toThrow(
			"guessing players",
		);
		room.connectedPlayers.add("spectator");
		room.spectatorPlayers.add("spectator");
		expect(() => chat.submit(room.uuid, "spectator", "hi", "2")).toThrow();
		expect(() => chat.submit(room.uuid, "a", "un chat", "3")).toThrow(
			"round word",
		);
		chat.submit(room.uuid, "a", "chat", "4");
		expect(() => chat.submit(room.uuid, "a", "chat", "5")).toThrow(
			"already",
		);
		vi.advanceTimersByTime(60000);
		expect(() => chat.submit(room.uuid, "b", "chat", "6")).toThrow(
			"not accepting",
		);
	});
	it("excludes paused wall time from speed and resets answers between turns", async () => {
		const room = await drawing();
		vi.advanceTimersByTime(10000);
		await service.toggleGame(room.uuid, "drawer");
		expect(() => guessWord(room, "a", "chat")).toThrow("not accepting");
		vi.advanceTimersByTime(120000);
		await service.toggleGame(room.uuid, "drawer");
		guessWord(room, "a", "chat");
		expect(getMatch(room)!.turn!.guesses.get("a")).toBe(10000);
		settleTurn(room);
		beginTurn(room);
		expect(guessWord(room, "a", "chat")).toBe(true);
	});
	it("requires two ready players and freezes settings", async () => {
		const room = await service.createLobby("host", defaults);
		room.readyPlayers.add("host");
		await expect(service.toggleGame(room.uuid, "host")).rejects.toThrow(
			NotEnoughReadyPlayersError,
		);
		const active = await drawing();
		await expect(
			service.updateLobby(active.uuid, { drawTime: 90 }, "drawer"),
		).rejects.toThrow("Settings");
	});
	it("persists final totals once with stable ID across failure/retry and excludes spectators", async () => {
		const room = await drawing();
		room.connectedPlayers.add("spectator");
		room.spectatorPlayers.add("spectator");
		guessWord(room, "a", "chat");
		settleTurn(room);
		const match = getMatch(room)!;
		match.endedAt = Date.now() + 1000;
		const write = vi
			.fn()
			.mockRejectedValueOnce(new Error("offline"))
			.mockResolvedValue(undefined);
		await expect(saveMatch(room, write)).rejects.toThrow("offline");
		expect(match.persistence).toBe("FAILED");
		await Promise.all([saveMatch(room, write), saveMatch(room, write)]);
		await saveMatch(room, write);
		expect(write).toHaveBeenCalledTimes(2);
		expect(write.mock.calls[0][0]).toEqual(write.mock.calls[1][0]);
		expect(write.mock.calls[1][0].scores).toHaveLength(3);
		expect(match.persistence).toBe("SAVED");
		const oldId = match.id;
		startMatch(room);
		expect(getMatch(room)!.id).not.toBe(oldId);
	});
});
