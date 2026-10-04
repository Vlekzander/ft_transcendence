// import { error } from "node:console";
import { prisma } from "../../lib/prisma.lib";

export async function getLeaderboard() {
	// 	try { //Q? maybe after
	const games = await prisma.game.findMany({
		where: {
			status: "FINISHED",
			// mode: "DUO", //Q? implement later
		},
		include: {
			participants: {
				select: {
					userId: true,
					score: true,
					user: {
						select: {
							// uuid: true,		//Q? see if userId is enoug, or if I really need the uuid for lb (they're are the same ?)
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
		const winner = game.participants.reduce((best, current) => {
			//reduce go through the whole tab by itself
			return current.score > best.score ? current : best;
		});

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
	const leaderboard = Array.from(winmap.values()).sort(
		(a, b) => b.wins - a.wins,
	);

	// }
	// 	catch (error) {
	// 		console.error(error);
	// 		throw error;
	// 	}
	return leaderboard;
}
