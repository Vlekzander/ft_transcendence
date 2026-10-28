import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma.lib", () => ({ prisma: {} }));
import { rankGames } from "@/modules/leaderboard/leaderboard.service";
const p = (userId: string, score: number) => ({
	userId,
	score,
	user: { username: userId, avatarPath: null },
});
describe("leaderboard final scores", () => {
	it("ignores empty and zero games, shares ties and counts victories", () => {
		const result = rankGames([
			{ participants: [] },
			{ participants: [p("a", 0), p("b", 0)] },
			{ participants: [p("a", 50), p("b", 50)] },
			{ participants: [p("a", 100), p("b", 50)] },
		]);
		expect(result.map((p) => [p.uuid, p.wins])).toEqual([
			["a", 2],
			["b", 1],
		]);
	});
});
