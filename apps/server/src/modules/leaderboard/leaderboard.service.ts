import { LeaderboardEntry } from "@ft_transcendence/shared";
import { prisma } from "../../lib/prisma.lib";

let cachedLeaderboard: Array<LeaderboardEntry> = [];
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

			if (current) {
				current.wins++;
			} else {
				winmap.set(winner.userId, {
					uuid: winner.userId,
					username: winner.user.username,
					wins: 1,
					avatarPath: winner.user.avatarPath,
				});
			}
		}
	}

	if (winmap.size > 0) {
		const userIds = Array.from(winmap.keys());
		const refreshedUsers = await prisma.user.findMany({
			where: { uuid: { in: userIds } },
			select: {
				uuid: true,
				username: true,
				avatarPath: true,
			},
		});

		const userMap = new Map(refreshedUsers.map((u) => [u.uuid, u]));

		for (const [userId, entry] of winmap.entries()) {
			const freshUser = userMap.get(userId);
			if (freshUser) {
				entry.username = freshUser.username;
				entry.avatarPath = freshUser.avatarPath;
			}
		}
	}

	cachedLeaderboard = Array.from(winmap.values()).sort(
		(a, b) => b.wins - a.wins,
	);
	isInit = true;

	return cachedLeaderboard;
}
