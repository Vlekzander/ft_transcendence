//ai

import { prisma } from "../lib/prisma.lib";

const ALICE_ID = "999a9e44-dc99-4af4-b33c-56f39f432568";
const BOB_ID = "2a086278-359d-437c-8054-2e9234638f60";
// const TUNDRA_ID = "2a086278-359d-437c-8054-2e9234638f60";

async function main() {
	const games = [
		{
			aliceScore: 10,
			bobScore: 5,
		},
		{
			aliceScore: 3,
			bobScore: 8,
		},
		{
			aliceScore: 12,
			bobScore: 7,
		},
	];

	for (const gameData of games) {
		const game = await prisma.game.create({
			data: {
				status: "FINISHED",
				participants: {
					create: [
						{
							userId: ALICE_ID,
							score: gameData.aliceScore,
						},
						{
							userId: BOB_ID,
							score: gameData.bobScore,
						},
					],
				},
			},
		});

		console.log(`Created game ${game.uuid}`);
	}
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
