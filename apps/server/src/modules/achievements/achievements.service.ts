import { prisma } from "../../lib/prisma.lib";

type PlayerStat = {
	wins: number;
	correct_guess: number;
	friends: number;
	bigMessages: number;
};

export abstract class Achievements {
	abstract name: string;
	abstract description: string;
	abstract objective: number;
	abstract icon: string;
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
	description = `Win ${this.objective} game`;
	icon = "trophy";
	current(stats: PlayerStat): number {
		return stats.wins;
	}
}

// Getting the hang of it
// Win 10 games
export class HangOfIt extends Achievements {
	name = "Getting the hang of it";
	objective = 10;
	description = `Win ${this.objective} games`;
	icon = "medal";
	current(stats: PlayerStat): number {
		return stats.wins;
	}
}

// Master
// Win 100 games
export class Master extends Achievements {
	name = "Master Player";
	objective = 100;
	description = `Win ${this.objective} games`;
	icon = "award";
	current(stats: PlayerStat): number {
		return stats.wins;
	}
}

// Legend
// Win 1000 games
export class Legend extends Achievements {
	name = "Legendary Player";
	objective = 1000;
	description = `Win ${this.objective} games`;
	icon = "crown";
	current(stats: PlayerStat): number {
		return stats.wins;
	}
}

// Unstoppable
// Win 3 games in a row
// export class Unstoppable extends Achievements {
// 	name = "Unstoppable";
// 	objective = 3;
// 	description = `Win ${this.objective} games in a row`
// 	current(stats: PlayerStat): number {
// 		return stats.game_streak;
// 	}
// } //hard to implement

// On Fire
// Be the first to guess the word in 3 consecutive rounds
// export class OnFire extends Achievements {
// 	name = "On fire !";
// 	objective = 3;
// 	description = `Win ${this.objective} game`
// 	current(stats: PlayerStat): number {
// 		return stats.first_guess_streak;
// 	}
// } //same

// Sharp Mind
// Guess 100 words correctly
export class SharpMind extends Achievements {
	name = "Sharp mind";
	objective = 100;
	description = `Guess ${this.objective} words correctly`;
	icon = "brain";
	current(stats: PlayerStat): number {
		return stats.correct_guess;
	}
}

// Wise man
// Guess 500 words
export class WiseMan extends Achievements {
	name = "Wise man";
	objective = 500;
	description = `Guess ${this.objective} words correctly`;
	icon = "graduation-cap";
	current(stats: PlayerStat): number {
		return stats.correct_guess;
	}
}

// BFF
// Make your first friend
export class BFF extends Achievements {
	name = "BFF";
	objective = 1;
	description = `Get yourself a new friend !`;
	icon = "heart";
	current(stats: PlayerStat): number {
		return stats.friends;
	}
}

// Poeple
// Have 10 friends
export class People extends Achievements {
	name = "People Person";
	objective = 10;
	description = `Make ${this.objective} friends!`;
	icon = "users";
	current(stats: PlayerStat): number {
		return stats.friends;
	}
}

// Shakespeare
// Send a BIG message
export class Shakespeare extends Achievements {
	name = "Shakespeare";
	objective = 1;
	description = `To be, or not to be`;
	icon = "mail-question-mark";
	current(stats: PlayerStat): number {
		return stats.bigMessages;
	}
}

const achievementsList: Achievements[] = [
	new FirstVictory(),
	new HangOfIt(),
	new Master(),
	new Legend(),
	// new Unstoppable(),	//roundstreak not implemented yet
	// new OnFire(),
	new SharpMind(),
	new WiseMan(),
	new BFF(),
	new People(),
	new Shakespeare(),
];

export async function getUserAchievements(uuid: string) {
	const userStats = await prisma.userStats.findUnique({
		where: { userId: uuid },
	});

	const friends = await prisma.friendship.count({
		where: {
			status: "ACCEPTED",
			OR: [{ senderId: uuid }, { receiverId: uuid }],
		},
	});
	const stats: PlayerStat = {
		wins: userStats?.wins ?? 0,
		correct_guess: userStats?.correctGuesses ?? 0,
		friends,
		bigMessages: userStats?.SentBigMessage ? 1 : 0,
	};

	return achievementsList.map((achievement, index) => ({
		uuid: String(index + 1),
		icon: achievement.icon,
		title: achievement.name,
		description: achievement.description,
		objective: achievement.objective,
		current: achievement.current(stats),
	}));
}
