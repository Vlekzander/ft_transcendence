import { prisma } from "../../lib/prisma.lib";

let cachedLeaderboard: Array<{
	uuid: string;
	username: string;
	wins: number;
	avatarPath: string | null;
}> = [];
const processedGames = new Set<string>();
let isInit = false;

export async function getLeaderboard() {
	const games = await prisma.game.findMany({
		where: {
			status: "FINISHED",
			...(isInit && processedGames.size > 0
				? { uuid: { notIn: Array.from(processedGames) } }
				: {}),
		},
		select: {
			uuid: true,
			participants: {
				select: {
					userId: true,
					score: true,
					user: {
						select: {
							username: true,
							avatarPath: true,
						},
					},
				},
			},
		},
	});

	if (isInit && games.length === 0) return cachedLeaderboard;

	const winmap = new Map(
		cachedLeaderboard.map((item) => [item.uuid, { ...item }]),
	);

	for (const game of games) {
		processedGames.add(game.uuid);
		if (game.participants.length === 0) continue;

		const maxScore = Math.max(...game.participants.map((p) => p.score));

		const winners = game.participants.filter((p) => p.score === maxScore);

		for (const winner of winners) {
			const current = winmap.get(winner.userId);

			if (current) current.wins++;
			else {
				winmap.set(winner.userId, {
					uuid: winner.userId,
					username: winner.user.username,
					wins: 1,
					avatarPath: winner.user.avatarPath,
				});
			}
		}
	}

	cachedLeaderboard = Array.from(winmap.values()).sort(
		(a, b) => b.wins - a.wins,
	);
	isInit = true;

	return cachedLeaderboard;
}
