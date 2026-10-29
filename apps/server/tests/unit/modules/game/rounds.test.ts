import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { CreateLobbySchema } from "@ft_transcendence/shared";
const mocks = vi.hoisted(() => ({
	send: vi.fn(),
	handlers: new Map<string, (ws: unknown, p: unknown) => Promise<void>>(),
	upsert: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/websocket.server", () => ({
	sendToWs: mocks.send,
	getOnlineUsers: () => [],
	registerPacketHandler: (name: string, fn: never) =>
		mocks.handlers.set(name, fn),
}));
vi.mock("@/lib/prisma.lib", () => ({
	prisma: { game: { upsert: mocks.upsert } },
}));
import {
	CHOOSE_WORD_SECONDS,
	lobbyService,
	lobbiesByJoinCode,
} from "@/modules/lobby/lobby.service";
import {
	registerGameSockets,
	scheduleRoundEnd,
	stopRoundTimer,
	statePacket,
	completeRoundIfSolved,
	reconcileGame,
} from "@/modules/lobby/game.socket";
import { getMatch, guessWord } from "@/modules/game/scoring.service";
import { NotEnoughReadyPlayersError } from "@/errors";
const defaults = CreateLobbySchema.parse({});
beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(100000);
	lobbiesByJoinCode.clear();
	mocks.upsert.mockClear();
	mocks.send.mockClear();
	registerGameSockets();
});
afterEach(() => {
	for (const r of lobbiesByJoinCode.values()) stopRoundTimer(r.uuid);
	vi.useRealTimers();
});
async function room() {
	const lobby = await lobbyService.createLobby("host", {
		...defaults,
		numberOfRounds: 1,
	});
	await lobbyService.joinLobby(lobby.uuid, "guest");
	lobby.readyPlayers = new Set(["host", "guest"]);
	await lobbyService.toggleGame(lobby.uuid, "host");
	scheduleRoundEnd(lobby);
	return lobby;
}
async function choose(lobby: Awaited<ReturnType<typeof room>>) {
	await mocks.handlers.get("CHOOSE_WORD")!(
		{ uuid: lobby.drawerIds[0] },
		{ lobbyUuid: lobby.uuid, word: lobby.wordChoices[0] },
	);
}
describe("round lifecycle", () => {
	it("saves positive totals after all players draw and keeps them on refresh", async () => {
		const lobby = await room();
		for (let turn = 0; turn < 2; turn++) {
			await choose(lobby);
			expect(statePacket(lobby).turnNumber).toBe(turn + 1);
			await vi.advanceTimersByTimeAsync(1000 + turn * 1000);
			const guesser = lobby.drawerIds[0] === "host" ? "guest" : "host";
			guessWord(lobby, guesser, lobby.selectedWord!);
			completeRoundIfSolved(lobby);
			expect(statePacket(lobby).turnNumber).toBe(turn + 1);
			expect(statePacket(lobby).totalTurns).toBe(2);
			await vi.advanceTimersByTimeAsync(4000);
		}
		await vi.dynamicImportSettled();
		expect(lobby.gamePhase).toBe("FINISHED");
		const totals = [...getMatch(lobby)!.scores.values()];
		expect(totals.every((score) => score > 0)).toBe(true);
		const saved = mocks.upsert.mock.calls[0][0].create.participants.create;
		expect(saved).toEqual(
			[...getMatch(lobby)!.scores].map(([userId, score]) => ({
				userId,
				score,
			})),
		);
		expect(mocks.upsert).toHaveBeenCalledTimes(1);
		expect(statePacket(lobby, "host").scores).toEqual(
			Object.fromEntries(getMatch(lobby)!.scores),
		);
	});

	it("auto-selects a word, times out, rotates drawer, then persists final game", async () => {
		const lobby = await room(),
			first = lobby.drawerIds[0];
		await vi.advanceTimersByTimeAsync(CHOOSE_WORD_SECONDS * 1000);
		expect(lobby.gamePhase).toBe("DRAWING");
		expect(statePacket(lobby, first!).selectedWord).toBeTruthy();
		expect(statePacket(lobby, "outsider").selectedWord).toBeNull();
		await vi.advanceTimersByTimeAsync(lobby.drawTime * 1000);
		expect(lobby.gamePhase).toBe("ROUND_END");
		expect(mocks.upsert).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(4000);
		expect(lobby.drawerIds[0]).not.toBe(first);
		await choose(lobby);
		await vi.advanceTimersByTimeAsync(lobby.drawTime * 1000 + 4000);
		expect(lobby.gamePhase).toBe("FINISHED");
		await vi.dynamicImportSettled();
		expect(getMatch(lobby)!.persistence).toBe("SAVED");
		expect(mocks.upsert).toHaveBeenCalledTimes(1);
		expect(mocks.upsert.mock.calls[0][0].create).toMatchObject({
			status: "FINISHED",
			participants: {
				create: expect.arrayContaining([
					{ userId: "host", score: 0 },
					{ userId: "guest", score: 0 },
				]),
			},
		});
	});
	it("ends early when everyone guesses and does not count a late timer twice", async () => {
		const lobby = await room();
		await choose(lobby);
		const guesser = lobby.drawerIds[0] === "host" ? "guest" : "host";
		vi.advanceTimersByTime(10000);
		guessWord(lobby, guesser, lobby.selectedWord!);
		completeRoundIfSolved(lobby);
		expect(lobby.gamePhase).toBe("ROUND_END");
		const scores = { ...statePacket(lobby).scores };
		completeRoundIfSolved(lobby);
		expect(statePacket(lobby).scores).toEqual(scores);
		await vi.advanceTimersByTimeAsync(4000);
		expect(lobby.gamePhase).toBe("CHOOSING");
		expect(lobby.drawerIds[0]).toBe(guesser);
		expect(getMatch(lobby)!.turn).toBeUndefined();
	});
	it("preserves result state on reconnect and handles departure of the drawer", async () => {
		const lobby = await room();
		await choose(lobby);
		await lobbyService.leaveLobby(lobby.uuid, lobby.drawerIds[0]);
		reconcileGame(lobby);
		expect(lobby.gamePhase).toBe("FINISHED");
		await vi.dynamicImportSettled();
		const send = vi.fn();
		const remaining = [...lobby.connectedPlayers][0];
		await mocks.handlers.get("JOIN_GAME")!(
			{ uuid: remaining, send },
			{ lobbyUuid: lobby.uuid },
		);
		expect(JSON.parse(send.mock.calls[0][0])).toMatchObject({
			phase: "FINISHED",
			matchId: getMatch(lobby)!.id,
		});
	});
});
async function duoRoom(players: string[]) {
	const lobby = await lobbyService.createLobby("host", {
		...defaults,
		mode: "DUO",
		numberOfRounds: 1,
	});
	for (const id of players) await lobbyService.joinLobby(lobby.uuid, id);
	lobby.readyPlayers = new Set(["host", ...players]);
	await lobbyService.toggleGame(lobby.uuid, "host");
	scheduleRoundEnd(lobby);
	return lobby;
}
async function playTurn(lobby: Awaited<ReturnType<typeof duoRoom>>) {
	await vi.advanceTimersByTimeAsync(
		CHOOSE_WORD_SECONDS * 1000 + lobby.drawTime * 1000 + 4000,
	);
}
describe("DUO mode", () => {
	it("refuses to start with fewer than 3 ready players", async () => {
		const lobby = await lobbyService.createLobby("host", {
			...defaults,
			mode: "DUO",
		});
		await lobbyService.joinLobby(lobby.uuid, "guest");
		lobby.readyPlayers = new Set(["host", "guest"]);
		await expect(
			lobbyService.toggleGame(lobby.uuid, "host"),
		).rejects.toThrow(NotEnoughReadyPlayersError);
	});
	it("pairs two new drawers per turn and lets the odd one out draw alone", async () => {
		const lobby = await duoRoom(["p1", "p2", "p3", "p4"]);
		const seen = new Set<string>();
		for (const [turn, size] of [
			[1, 2],
			[2, 2],
			[3, 1],
		]) {
			expect(lobby.drawerIds).toHaveLength(size);
			for (const id of lobby.drawerIds) {
				expect(seen.has(id)).toBe(false);
				seen.add(id);
			}
			expect(statePacket(lobby).turnNumber).toBe(turn);
			expect(statePacket(lobby).totalTurns).toBe(3);
			await playTurn(lobby);
		}
		expect(lobby.gamePhase).toBe("FINISHED");
	});
	it("finishes the turn when a drawer leaves, then ends below 3 players", async () => {
		const lobby = await duoRoom(["p1", "p2"]);
		await vi.advanceTimersByTimeAsync(CHOOSE_WORD_SECONDS * 1000);
		await lobbyService.leaveLobby(lobby.uuid, lobby.drawerIds[0]);
		reconcileGame(lobby);
		expect(lobby.gamePhase).toBe("DRAWING");
		await vi.advanceTimersByTimeAsync(lobby.drawTime * 1000 + 4000);
		expect(lobby.gamePhase).toBe("FINISHED");
	});
});
describe("DUO word picks", () => {
	async function pick(
		lobby: Awaited<ReturnType<typeof duoRoom>>,
		id: string,
		word: string,
	) {
		await mocks.handlers.get("CHOOSE_WORD")!(
			{ uuid: id },
			{ lobbyUuid: lobby.uuid, word },
		);
	}
	async function leave(
		lobby: Awaited<ReturnType<typeof duoRoom>>,
		id: string,
	) {
		await lobbyService.leaveLobby(lobby.uuid, id);
		reconcileGame(lobby);
	}
	it("stores changeable picks visible only to drawers", async () => {
		const lobby = await duoRoom(["p1", "p2"]);
		const [a, b] = lobby.drawerIds;
		const [w0, w1] = lobby.wordChoices;
		const guesser = [...lobby.connectedPlayers].find(
			(id) => !lobby.drawerIds.includes(id),
		)!;
		await pick(lobby, a, w0);
		expect(lobby.gamePhase).toBe("CHOOSING");
		expect(statePacket(lobby, b).picks).toEqual({ [a]: w0 });
		expect(statePacket(lobby, guesser).picks).toEqual({});
		await pick(lobby, a, w1);
		expect(statePacket(lobby, a).picks).toEqual({ [a]: w1 });
	});
	it("draws one of two different picks at expiry", async () => {
		const lobby = await duoRoom(["p1", "p2"]);
		const [a, b] = lobby.drawerIds;
		const [w0, w1] = lobby.wordChoices;
		await pick(lobby, a, w0);
		await pick(lobby, b, w1);
		await vi.advanceTimersByTimeAsync(CHOOSE_WORD_SECONDS * 1000);
		expect(lobby.gamePhase).toBe("DRAWING");
		expect([w0, w1]).toContain(lobby.selectedWord);
	});
	it("draws the only pick at expiry", async () => {
		const lobby = await duoRoom(["p1", "p2"]);
		const w1 = lobby.wordChoices[1];
		await pick(lobby, lobby.drawerIds[1], w1);
		await vi.advanceTimersByTimeAsync(CHOOSE_WORD_SECONDS * 1000);
		expect(lobby.selectedWord).toBe(w1);
	});
	it("starts at once when the partner leaves after the other picked", async () => {
		const lobby = await duoRoom(["p1", "p2"]);
		const [a, b] = lobby.drawerIds;
		const w1 = lobby.wordChoices[1];
		await pick(lobby, b, lobby.wordChoices[0]);
		await pick(lobby, a, w1);
		await leave(lobby, b);
		expect(lobby.picks.has(b)).toBe(false);
		expect(lobby.gamePhase).toBe("DRAWING");
		expect(lobby.selectedWord).toBe(w1);
	});
	it("lets the remaining drawer start instantly by clicking", async () => {
		const lobby = await duoRoom(["p1", "p2"]);
		const [a, b] = lobby.drawerIds;
		await leave(lobby, b);
		expect(lobby.gamePhase).toBe("CHOOSING");
		await pick(lobby, a, lobby.wordChoices[2]);
		expect(lobby.gamePhase).toBe("DRAWING");
		expect(lobby.selectedWord).toBe(lobby.wordChoices[2]);
	});
});
describe("player leaving mid-turn", () => {
	it("drops a leaver from the turn even if they come back as spectator", async () => {
		const lobby = await lobbyService.createLobby("host", {
			...defaults,
			numberOfRounds: 1,
		});
		await lobbyService.joinLobby(lobby.uuid, "p1");
		await lobbyService.joinLobby(lobby.uuid, "p2");
		lobby.readyPlayers = new Set(["host", "p1", "p2"]);
		await lobbyService.toggleGame(lobby.uuid, "host");
		scheduleRoundEnd(lobby);
		await choose(lobby);
		const [left, stays] = [...lobby.connectedPlayers].filter(
			(id) => !lobby.drawerIds.includes(id),
		);
		guessWord(lobby, left, lobby.selectedWord!);
		await lobbyService.leaveLobby(lobby.uuid, left);
		reconcileGame(lobby);
		await lobbyService.joinLobby(lobby.uuid, left);
		const turn = getMatch(lobby)!.turn!;
		expect(turn.eligible).not.toContain(left);
		expect(turn.guesses.has(left)).toBe(false);
		expect(() => guessWord(lobby, left, lobby.selectedWord!)).toThrow();
		expect(lobby.gamePhase).toBe("DRAWING");
		guessWord(lobby, stays, lobby.selectedWord!);
		completeRoundIfSolved(lobby);
		expect(lobby.gamePhase).toBe("ROUND_END");
	});
});
