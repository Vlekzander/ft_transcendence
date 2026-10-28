import { prisma } from "../lib/prisma.lib";

const ALICE_ID = "44b5283f-37da-46e5-9e53-8e2bdee89ac5";
const BOB_ID = "6d9363f5-4b76-44bf-9fc1-94fcb37d09ee";
const TUNDRA_ID = "21497eef-b62d-47ce-b422-48b8a37b3185";
const BAMBI_ID = "9c4742ba-80c0-44f0-bd6c-6d7bb997029c";
// const TWENTY_ID = "cc78444a-0f83-4ae8-90d1-295a1371d6f1";

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
