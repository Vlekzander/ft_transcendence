import { prisma } from "../lib/prisma.lib";

const ALICE_ID = "999a9e44-dc99-4af4-b33c-56f39f432568";
const BOB_ID = "2a086278-359d-437c-8054-2e9234638f60";
const TUNDRA_ID = "5812ef46-44e1-4512-a7ba-b7e5a0f1a025";
const BAMBI_ID = "4848f1cd-7f92-4862-8d13-a865f60c709a";

async function main() {
	await prisma.game.deleteMany({});
	console.log("Existing games deleted.");
	const games = [
		// Alice vs Bob
		{
			players: [
				{ userId: ALICE_ID, score: 2 },
				{ userId: BOB_ID, score: 5 },
			],
		},
		// Bambi vs Bob
		{
			players: [
				{ userId: BAMBI_ID, score: 2 },
				{ userId: BOB_ID, score: 5 },
			],
		},
		// Bambi vs Bob
		{
			players: [
				{ userId: BAMBI_ID, score: 7 },
				{ userId: BOB_ID, score: 5 },
			],
		},
		// Alice vs Bob
		{
			players: [
				{ userId: ALICE_ID, score: 3 },
				{ userId: BOB_ID, score: 8 },
			],
		},
		// Alice vs Bob
		{
			players: [
				{ userId: ALICE_ID, score: 12 },
				{ userId: BOB_ID, score: 7 },
			],
		},
		// Tundra vs Alice
		{
			players: [
				{ userId: TUNDRA_ID, score: 9 },
				{ userId: ALICE_ID, score: 6 },
			],
		},
		// Tundra vs Bob
		{
			players: [
				{ userId: TUNDRA_ID, score: 4 },
				{ userId: BOB_ID, score: 11 },
			],
		},
		// Tundra vs Alice
		{
			players: [
				{ userId: TUNDRA_ID, score: 13 },
				{ userId: ALICE_ID, score: 8 },
			],
		},
	];
	for (const gameData of games) {
		const game = await prisma.game.create({
			data: {
				mode: "DUO",
				status: "FINISHED",
				participants: {
					create: gameData.players,
				},
			},
		});

		console.log(`Created game ${game.uuid}`);
	}
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
