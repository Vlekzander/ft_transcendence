import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { CreateLobbySchema } from "@ft_transcendence/shared";
import { prisma } from "@/lib/prisma.lib";
import { lobbyService, lobbiesByJoinCode } from "@/modules/lobby/lobby.service";
import {
	beginTurn,
	getMatch,
	guessWord,
	saveMatch,
	settleTurn,
} from "@/modules/game/scoring.service";
import { assertTestDatabase } from "./database";

const ids = [1, 2, 3, 4].map(
	(n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
);
beforeEach(async () => {
	assertTestDatabase();
	await prisma.game.deleteMany();
	await prisma.user.deleteMany();
	await prisma.user.createMany({
		data: ids.map((uuid, i) => ({
			uuid,
			username: `result${i}`,
			email: `result${i}@test.local`,
			password: "unused",
		})),
	});
	lobbiesByJoinCode.clear();
});
afterAll(async () => {
	lobbiesByJoinCode.clear();
	await prisma.$disconnect();
});

async function drawing(mode: "SOLO" | "DUO") {
	const room = await lobbyService.createLobby(
		ids[0],
		CreateLobbySchema.parse({ mode }),
	);
	for (const id of ids.slice(1)) await lobbyService.joinLobby(room.uuid, id);
	room.readyPlayers = new Set(ids.slice(0, 3)); // Fourth player spectates.
	await lobbyService.toggleGame(room.uuid, ids[0]);
	room.gamePhase = "DRAWING";
	room.selectedWord = "chat";
	room.timerEndsAt = Date.now() + room.drawTime * 1000 - 1000;
	beginTurn(room);
	return room;
}

describe("game result persistence with real Prisma queries", () => {
	it.each(["SOLO", "DUO"] as const)(
		"stores %s scores once, excludes spectators and uses a match UUID v7",
		async (mode) => {
			const room = await drawing(mode);
			const match = getMatch(room)!;
			expect(match.turn!.drawers).toHaveLength(mode === "DUO" ? 2 : 1);
			for (const id of match.turn!.eligible)
				expect(guessWord(room, id, "CHAT")).toBe(true);
			settleTurn(room);
			match.endedAt = Date.now();
			await Promise.all([saveMatch(room), saveMatch(room)]);
			await saveMatch(room);
			const games = await prisma.game.findMany({
				include: { participants: true },
			});
			expect(games).toHaveLength(1);
			expect(games[0]).toMatchObject({
				uuid: match.id,
				status: "FINISHED",
				mode,
			});
			expect(match.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);
			expect(match.id).not.toBe(room.uuid);
			expect(games[0].participants).toHaveLength(3);
			for (const participant of games[0].participants) {
				expect(participant.score).toBe(
					match.scores.get(participant.userId),
				);
				expect(participant.score).toBeGreaterThan(0);
			}
			expect(games[0].participants.some((p) => p.userId === ids[3])).toBe(
				false,
			);
			expect(match.persistence).toBe("SAVED");
		},
	);

	it("does not persist a game without points", async () => {
		const room = await drawing("SOLO");
		settleTurn(room);
		getMatch(room)!.endedAt = Date.now();
		await saveMatch(room);
		expect(getMatch(room)!.persistence).toBe("CANCELED");
		expect(await prisma.game.count()).toBe(0);
		expect(await prisma.userOnGame.count()).toBe(0);
	});

	it("rolls back an invalid participant and retries without duplicating a game", async () => {
		const room = await drawing("SOLO"),
			match = getMatch(room)!;
		guessWord(room, match.turn!.eligible[0], "chat");
		settleTurn(room);
		match.endedAt = Date.now();
		const missing = "00000000-0000-4000-8000-000000000099";
		match.scores.set(missing, 10);
		await expect(saveMatch(room)).rejects.toThrow();
		expect(match.persistence).toBe("FAILED");
		expect(await prisma.game.count()).toBe(0);
		expect(await prisma.userOnGame.count()).toBe(0);
		match.scores.delete(missing);
		await saveMatch(room);
		expect(await prisma.game.count()).toBe(1);
		expect(match.persistence).toBe("SAVED");
	});
});
