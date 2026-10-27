import { prisma } from "../../lib/prisma.lib";

type Participant = {
	userId: string;
	score: number;
	user: { username: string; avatarPath: string | null };
};
export function rankGames(games: { participants: Participant[] }[]) {
	const wins = new Map<
		string,
		{
			uuid: string;
			username: string;
			avatarPath: string | null;
			wins: number;
		}
	>();
	for (const game of games) {
		const best = Math.max(0, ...game.participants.map((p) => p.score));
		if (best === 0) continue;
		// Equal positive scores share the victory; empty/zero-score games award no win.
		for (const winner of game.participants.filter(
			(p) => p.score === best,
		)) {
			const entry = wins.get(winner.userId) ?? {
				uuid: winner.userId,
				...winner.user,
				wins: 0,
			};
			entry.wins++;
			wins.set(winner.userId, entry);
		}
	}
	return [...wins.values()].sort(
		(a, b) => b.wins - a.wins || a.uuid.localeCompare(b.uuid),
	);
}
export async function getLeaderboard() {
	const games = await prisma.game.findMany({
		where: { status: "FINISHED" },
		include: {
			participants: {
				select: {
					userId: true,
					score: true,
					user: { select: { username: true, avatarPath: true } },
				},
			},
		},
	});
	return rankGames(games);
}
