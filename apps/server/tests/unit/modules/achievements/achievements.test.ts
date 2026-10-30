import { describe, expect, it, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

const mocks = vi.hoisted(() => ({
	findUniqueUserStats: vi.fn(),
	countFriendship: vi.fn(),
}));

vi.mock("@/lib/prisma.lib", () => ({
	prisma: {
		userStats: {
			findUnique: mocks.findUniqueUserStats,
		},
		friendship: {
			count: mocks.countFriendship,
		},
	},
}));

import * as achievementsService from "@/modules/achievements/achievements.service";
import * as achievementsController from "@/modules/achievements/achievements.controller";

describe("Achievements Module", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("achievements.service", () => {
		it("should return all achievements with correct progress based on user stats", async () => {
			mocks.findUniqueUserStats.mockResolvedValueOnce({
				wins: 5,
				correctGuesses: 50,
				SentBigMessage: true,
			});
			mocks.countFriendship.mockResolvedValueOnce(3);

			const result =
				await achievementsService.getUserAchievements("user-uuid-1");

			expect(result).toHaveLength(9);

			const firstVictory = result.find(
				(a) => a.title === "First victory !",
			);
			expect(firstVictory).toMatchObject({
				title: "First victory !",
				objective: 1,
				current: 5,
			});

			const sharpMind = result.find((a) => a.title === "Sharp mind");
			expect(sharpMind).toMatchObject({
				objective: 100,
				current: 50,
			});

			const bff = result.find((a) => a.title === "BFF");
			expect(bff).toMatchObject({
				objective: 1,
				current: 3,
			});

			const shakespeare = result.find((a) => a.title === "Shakespeare");
			expect(shakespeare).toMatchObject({
				objective: 1,
				current: 1,
			});
		});

		it("should handle missing user stats gracefully with default values (0)", async () => {
			mocks.findUniqueUserStats.mockResolvedValueOnce(null);
			mocks.countFriendship.mockResolvedValueOnce(0);

			const result =
				await achievementsService.getUserAchievements("user-uuid-2");

			expect(result).toHaveLength(9);
			const firstVictory = result.find(
				(a) => a.title === "First victory !",
			);
			expect(firstVictory?.current).toBe(0);

			const shakespeare = result.find((a) => a.title === "Shakespeare");
			expect(shakespeare?.current).toBe(0);
		});
	});

	describe("achievements.controller", () => {
		it("should call achievementsService and return 200 with achievements JSON", async () => {
			mocks.findUniqueUserStats.mockResolvedValueOnce({
				wins: 1,
				correctGuesses: 1,
				SentBigMessage: false,
			});
			mocks.countFriendship.mockResolvedValueOnce(1);

			const req = {
				params: { uuid: "user-uuid-3" },
			} as unknown as Request<{ uuid: string }>;

			const res = {
				status: vi.fn().mockReturnThis(),
				json: vi.fn(),
			} as unknown as Response;

			const next = vi.fn() as NextFunction;

			await achievementsController.getUserAchievements(req, res, next);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					achievements: expect.any(Array),
				}),
			);
			expect(next).not.toHaveBeenCalled();
		});

		it("should call next with error if service throws an exception", async () => {
			const error = new Error("Database error");
			mocks.findUniqueUserStats.mockRejectedValueOnce(error);

			const req = {
				params: { uuid: "user-uuid-4" },
			} as unknown as Request<{ uuid: string }>;

			const res = {
				status: vi.fn(),
				json: vi.fn(),
			} as unknown as Response;

			const next = vi.fn() as NextFunction;

			await achievementsController.getUserAchievements(req, res, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
