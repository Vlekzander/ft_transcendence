import { prisma } from "../../lib/prisma.lib";

export async function getLeaderboard() {
	const games = await prisma.game.findMany({
		where: {
			status: "FINISHED",
		},
		include: {
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

	const winmap = new Map<
		string,
		{
			uuid: string;
			username: string;
			wins: number;
			avatarPath: string | null;
		}
	>();

	for (const game of games) {
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

	return Array.from(winmap.values()).sort((a, b) => b.wins - a.wins);
}
