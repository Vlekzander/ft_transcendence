import { prisma } from "../lib/prisma.lib";

const ALICE_ID = "00f8d6e4-c074-47de-9c58-540e4146a56e";
const BOB_ID = "151d4685-b88c-4c75-abbc-32ea273dc23d";
const TUNDRA_ID = "126162a7-770f-4b25-9707-6c09a6bcc124";
const BAMBI_ID = "9d0e4bbd-ce4a-4c0a-ae5a-d2f2092e48d0";
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
