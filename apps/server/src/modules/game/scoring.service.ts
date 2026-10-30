import { v7 as uuidv7 } from "uuid";
import type { LobbyEntity } from "../lobby/lobby.mapper";

export type Turn = {
	drawers: string[];
	word: string;
	eligible: string[];
	guesses: Map<string, number>;
	durationMs: number;
	settled: boolean;
};
export type Match = {
	id: string;
	mode: "SOLO" | "DUO";
	startedAt: number;
	endedAt?: number;
	scores: Map<string, number>;
	turn?: Turn;
	lastTurn: { word: string; points: Record<string, number> } | null;
	persistence: "NONE" | "SAVING" | "SAVED" | "FAILED" | "CANCELED";
	saving?: Promise<void>;
};
const matches = new WeakMap<LobbyEntity, Match>();
export const normalizeWord = (s: string) =>
	s.normalize("NFKC").trim().toLowerCase();
export function getMatch(lobby: LobbyEntity) {
	return matches.get(lobby);
}
export function startMatch(lobby: LobbyEntity) {
	const players = [...lobby.connectedPlayers].filter(
		(id) => !lobby.spectatorPlayers.has(id),
	);
	const match: Match = {
		id: uuidv7(),
		mode: lobby.mode,
		startedAt: Date.now(),
		scores: new Map(players.map((id) => [id, 0])),
		lastTurn: null,
		persistence: "NONE",
	};
	matches.set(lobby, match);
	return match;
}
export function beginTurn(lobby: LobbyEntity) {
	const match = getMatch(lobby);
	if (!match || lobby.drawerIds.length === 0 || !lobby.selectedWord)
		throw new Error("No active match or word");
	match.turn = {
		drawers: [...lobby.drawerIds],
		word: normalizeWord(lobby.selectedWord),
		eligible: [...lobby.connectedPlayers].filter(
			(id) =>
				!lobby.drawerIds.includes(id) &&
				match.scores.has(id) &&
				!lobby.spectatorPlayers.has(id) &&
				!lobby.bannedPlayers.has(id),
		),
		guesses: new Map(),
		durationMs: lobby.drawTime * 1000,
		settled: false,
	};
	match.lastTurn = null;
}
export function elapsedMs(lobby: LobbyEntity, turn: Turn) {
	const remaining =
		lobby.timerEndsAt === null
			? lobby.timeRemainingMs
			: Math.max(0, lobby.timerEndsAt - Date.now());
	return Math.max(0, Math.min(turn.durationMs, turn.durationMs - remaining));
}
export function guessWord(
	lobby: LobbyEntity,
	sender: string,
	content: string,
): boolean {
	const turn = getMatch(lobby)?.turn;
	if (!turn || turn.settled) return false;
	const normalized = normalizeWord(content);
	if (!normalized.includes(turn.word)) return false;
	if (normalized !== turn.word)
		throw new Error("Message contains the round word");
	if (
		!lobby.gameStarted ||
		lobby.gamePhase !== "DRAWING" ||
		!lobby.timerEndsAt ||
		Date.now() >= lobby.timerEndsAt
	)
		throw new Error("This turn is not accepting guesses");
	if (!turn.eligible.includes(sender))
		throw new Error("Only guessing players can answer");
	if (turn.guesses.has(sender))
		throw new Error("You already guessed this word");
	turn.guesses.set(sender, elapsedMs(lobby, turn));
	return true;
}
export function allGuessed(lobby: LobbyEntity) {
	const turn = getMatch(lobby)?.turn;
	if (!turn || turn.settled) return false;
	const remaining = turn.eligible.filter(
		(id) => lobby.connectedPlayers.has(id) && !lobby.bannedPlayers.has(id),
	);
	return remaining.every((id) => turn.guesses.has(id));
}

export function dropLeftPlayers(lobby: LobbyEntity) {
	const turn = getMatch(lobby)?.turn;
	if (!turn || turn.settled) return;
	const gone = (id: string) =>
		!lobby.connectedPlayers.has(id) || lobby.bannedPlayers.has(id);
	turn.eligible = turn.eligible.filter((id) => !gone(id));
	for (const id of turn.guesses.keys()) if (gone(id)) turn.guesses.delete(id);
}

export function calculateTurn(
	turn: Turn,
	endedMs: number,
): Record<string, number> {
	const points: Record<string, number> = {};
	const ratio = turn.eligible.length
		? turn.guesses.size / turn.eligible.length
		: 0;
	const speed = 1 - Math.min(1, Math.max(0, endedMs / turn.durationMs));
	for (const [id, ms] of turn.guesses) {
		points[id] = Math.round(
			100 +
				500 * (1 - Math.min(1, ms / turn.durationMs)) +
				200 * ratio +
				200 * ratio * speed,
		);
	}
	for (const id of turn.drawers)
		points[id] = Math.round(500 * ratio + 500 * ratio * speed);
	return points;
}
export function settleTurn(lobby: LobbyEntity) {
	const match = getMatch(lobby),
		turn = match?.turn;
	if (!match || !turn || turn.settled) return;
	turn.settled = true;
	const points = calculateTurn(turn, elapsedMs(lobby, turn));
	for (const [id, value] of Object.entries(points))
		match.scores.set(id, (match.scores.get(id) ?? 0) + value);
	match.lastTurn = { word: lobby.selectedWord ?? turn.word, points };
}
export type ResultWriter = (result: {
	id: string;
	mode: "SOLO" | "DUO";
	duration: number;
	scores: { userId: string; score: number }[];
}) => Promise<void>;

const writeResult: ResultWriter = async (result) => {
	const { prisma } = await import("../../lib/prisma.lib");
	// Nested create is atomic; the stable match ID makes retries idempotent.
	await prisma.$transaction(async (tx) => {
		// Create game only if not saved yet.
		const existingGame = await tx.game.findUnique({
			where: { uuid: result.id },
			select: { uuid: true },
		});
		if (existingGame) return;

		await tx.game.create({
			data: {
				uuid: result.id,
				mode: result.mode,
				status: "FINISHED",
				duration: result.duration,
				participants: { create: result.scores },
			},
		});

		if (result.scores.length === 0) return;

		const highestScore = Math.max(
			...result.scores.map((participant) => participant.score),
		);

		const winners = result.scores.filter(
			(participant) => participant.score === highestScore,
		);

		await Promise.all(
			winners.map((winner) =>
				tx.userStats.upsert({
					where: { userId: winner.userId },
					create: {
						userId: winner.userId,
						wins: 1,
					},
					update: {
						wins: { increment: 1 },
					},
				}),
			),
		);

		await Promise.all(
			result.scores.map(async (r) => {
				const existing = await tx.userStats.findUnique({
					where: { userId: r.userId },
					select: { bestScore: true },
				});

				const newBestScore = Math.max(
					existing?.bestScore ?? 0,
					r.score,
				);

				return tx.userStats.upsert({
					where: { userId: r.userId },
					create: {
						userId: r.userId,
						games: 1,
						bestScore: r.score,
					},
					update: {
						games: { increment: 1 },
						bestScore: newBestScore,
					},
				});
			}),
		);
	});
};

export async function saveMatch(
	lobby: LobbyEntity,
	writer: ResultWriter = writeResult,
): Promise<void> {
	const match = getMatch(lobby);
	if (!match || !match.endedAt || match.persistence === "SAVED") return;
	const hasScores = Array.from(match.scores.values()).some(
		(v: number) => v > 0,
	);
	if (!hasScores) {
		match.persistence = "CANCELED";
		return undefined;
	}
	if (match.saving) return match.saving;
	match.persistence = "SAVING";
	match.saving = (async () => {
		try {
			await writer({
				id: match.id,
				mode: match.mode,
				duration: Math.max(
					0,
					Math.round((match.endedAt! - match.startedAt) / 1000),
				),
				scores: [...match.scores].map(([userId, score]) => ({
					userId,
					score,
				})),
			});
			match.persistence = "SAVED";
		} catch (error) {
			match.persistence = "FAILED";
			throw error;
		} finally {
			match.saving = undefined;
		}
	})();
	return match.saving;
}
