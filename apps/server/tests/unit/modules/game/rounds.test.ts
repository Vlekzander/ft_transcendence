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
import { lobbyService, lobbiesByJoinCode } from "@/modules/lobby/lobby.service";
import {
	registerGameSockets,
	scheduleRoundEnd,
	stopRoundTimer,
	statePacket,
	completeRoundIfSolved,
	reconcileGame,
} from "@/modules/lobby/game.socket";
import { getMatch, guessWord } from "@/modules/game/scoring.service";
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
		{ uuid: lobby.drawerId },
		{ lobbyUuid: lobby.uuid, word: lobby.wordChoices[0] },
	);
}
describe("round lifecycle", () => {
	it("saves positive totals after all players draw and keeps them on refresh", async () => {
		const lobby = await room();
		for (let turn = 0; turn < 2; turn++) {
			await choose(lobby);
			expect(statePacket(lobby).playerNumber).toBe(turn + 1);
			await vi.advanceTimersByTimeAsync(1000 + turn * 1000);
			const guesser = lobby.drawerId === "host" ? "guest" : "host";
			guessWord(lobby, guesser, lobby.selectedWord!);
			completeRoundIfSolved(lobby);
			expect(statePacket(lobby).playerNumber).toBe(turn + 1);
			expect(statePacket(lobby).totalPlayers).toBe(2);
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
			first = lobby.drawerId;
		await vi.advanceTimersByTimeAsync(lobby.timeToChooseWord * 1000);
		expect(lobby.gamePhase).toBe("DRAWING");
		expect(statePacket(lobby, first!).selectedWord).toBeTruthy();
		expect(statePacket(lobby, "outsider").selectedWord).toBeNull();
		await vi.advanceTimersByTimeAsync(lobby.drawTime * 1000);
		expect(lobby.gamePhase).toBe("ROUND_END");
		expect(mocks.upsert).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(4000);
		expect(lobby.drawerId).not.toBe(first);
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
		const guesser = lobby.drawerId === "host" ? "guest" : "host";
		vi.advanceTimersByTime(10000);
		guessWord(lobby, guesser, lobby.selectedWord!);
		completeRoundIfSolved(lobby);
		expect(lobby.gamePhase).toBe("ROUND_END");
		const scores = { ...statePacket(lobby).scores };
		completeRoundIfSolved(lobby);
		expect(statePacket(lobby).scores).toEqual(scores);
		await vi.advanceTimersByTimeAsync(4000);
		expect(lobby.gamePhase).toBe("CHOOSING");
		expect(lobby.drawerId).toBe(guesser);
		expect(getMatch(lobby)!.turn).toBeUndefined();
	});
	it("preserves result state on reconnect and handles departure of the drawer", async () => {
		const lobby = await room();
		await choose(lobby);
		await lobbyService.leaveLobby(lobby.uuid, lobby.drawerId!);
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
