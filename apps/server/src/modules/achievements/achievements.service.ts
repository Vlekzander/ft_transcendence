import { prisma } from "../../lib/prisma.lib";
import { PlayerStat } from "@ft_transcendence/shared";

export abstract class Achievements {
	abstract name: string;
	abstract objective: number;
	abstract current(stats: PlayerStat): number;
	progress(stats: PlayerStat): number {
		return Math.min((this.current(stats) / this.objective) * 100, 100);
	}
	IsEarned(stats: PlayerStat): boolean {
		return this.current(stats) >= this.objective;
	}
}

// First Victory
// Win your first game
export class FirstVictory extends Achievements {
	name = "First victory !";
	objective = 1;
	current(stats: PlayerStat): number {
		return stats.wins;
	}
}

// Getting the hang of it
// Win 10 games
export class HangOfIt extends Achievements {
	name = "Getting the hang of it";
	objective = 10;
	current(stats: PlayerStat): number {
		return stats.wins;
	}
}

// Master
// Win 100 games
export class Master extends Achievements {
	name = "Master Player";
	objective = 100;
	current(stats: PlayerStat): number {
		return stats.wins;
	}
}

// Legend
// Win 1000 games
export class Legend extends Achievements {
	name = "Legendary Player";
	objective = 1000;
	current(stats: PlayerStat): number {
		return stats.wins;
	}
}

// Unstoppable
// Win 3 games in a row
export class Unstoppable extends Achievements {
	name = "Unstoppable";
	objective = 3;
	current(stats: PlayerStat): number {
		return stats.game_streak;
	}
} //Réu

// On Fire
// Be the first to guess the word in 3 consecutive rounds
export class OnFire extends Achievements {
	name = "On fire !";
	objective = 3;
	current(stats: PlayerStat): number {
		return stats.first_guess_streak;
	}
}

// Sharp Mind
// Guess 100 words correctly
export class SharpMind extends Achievements {
	name = "Sharp mind";
	objective = 100;
	current(stats: PlayerStat): number {
		return stats.correct_guess;
	}
}

// Wise man
// Guess 500 words
export class WiseMan extends Achievements {
	name = "Wise man";
	objective = 500;
	current(stats: PlayerStat): number {
		return stats.correct_guess;
	}
}

// BFF
// Make your first friend

// Man of the poeple
// Have 10 friends

// 1st Warning
// Get ban from a lobby

// First Words
// Send your first message // maybe little hard to implement here ?

const achievementsList: Achievements[] = [
	new FirstVictory(),
	new HangOfIt(),
	new Master(),
	new Legend(),
	new Unstoppable(),
	new OnFire(),
	new SharpMind(),
	new WiseMan(),
];

export async function getUserAchievements(uuid: string) {
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
						},
					},
				},
			},
		},
	});
	let wins = 0;
	for (const game of games) {
		// Find the highest score in this game.
		const highestScore = Math.max(
			...game.participants.map((participant) => participant.score),
		);

		//for tie
		const topPlayers = game.participants.filter(
			(participant) => participant.score === highestScore,
		);

		if (topPlayers.length === 1 && topPlayers[0].userId === uuid) {
			wins++;
		}
	}

	const stats: PlayerStat = {
		wins,
		correct_guess: 0,
		first_guess_streak: 0,
		round_streak: 0,
		game_streak: 0,
	};

	return achievementsList.map((achievement, index) => ({
		uuid: String(index + 1),
		icon: "trophy",
		title: achievement.name,
		description: `Win ${achievement.objective} games`,
		objective: achievement.objective,
		current: achievement.current(stats),
	}));
}
