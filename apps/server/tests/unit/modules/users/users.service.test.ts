import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma.lib";
import { generateHash } from "@/utils/hash.util";
import {
	getPrismaConstraintFields,
	sharedService,
	userDtoSelect,
} from "@/modules/shared/shared.service";
import { AVATAR_DIR } from "@/config/upload.config";
import { UsersService } from "@/modules/users/users.service";
import { isUserOnline } from "@/websocket.server";
import fs from "node:fs";

vi.mock("@/lib/prisma.lib", () => ({
	prisma: {
		user: {
			update: vi.fn(),
		},
		userOnGame: {
			findMany: vi.fn(),
		},
	},
}));

vi.mock("@/utils/hash.util", () => ({
	generateHash: vi.fn(),
}));

vi.mock("@/websocket.server", () => ({
	isUserOnline: vi.fn(),
}));

vi.mock("@/modules/shared/shared.service", () => ({
	getPrismaConstraintFields: vi.fn(),
	sharedService: {
		getUserById: vi.fn(),
	},
	userDtoSelect: {
		uuid: true,
		email: true,
		username: true,
		avatarPath: true,
		createdAt: true,
	},
}));

vi.mock("node:fs", () => ({
	default: {
		existsSync: vi.fn(),
		mkdirSync: vi.fn(),
		unlinkSync: vi.fn(),
	},
}));

const mockedFindMany = vi.mocked(prisma.userOnGame.findMany);
const mockedUpdate = vi.mocked(prisma.user.update);
const mockedGenerateHash = vi.mocked(generateHash);
const mockedGetPrismaConstraintFields = vi.mocked(getPrismaConstraintFields);
const mockedGetUserById = vi.mocked(sharedService.getUserById);
const mockedUnlinkSync = vi.mocked(fs.unlinkSync);
const mockedIsUserOnline = vi.mocked(isUserOnline);

const user = {
	uuid: "user-uuid",
	email: "user@email.com",
	username: "user",
	avatarPath: null,
	createdAt: new Date("2026-01-01"),
};

describe("users/users.service", () => {
	const service = new UsersService();

	beforeEach(() => {
		vi.clearAllMocks();
		mockedIsUserOnline.mockReturnValue(false);
	});

	describe("getUserHistory", () => {
		it("should return only finished games with participant online status", async () => {
			mockedFindMany.mockResolvedValue([
				{
					game: {
						uuid: "finished-game",
						mode: "CLASSIC",
						status: "FINISHED",
						duration: 120,
						participants: [
							{
								userId: "player-uuid",
								score: 100,
								user: {
									uuid: "player-uuid",
									username: "player",
									avatarPath: null,
								},
							},
						],
					},
				},
				{
					game: {
						uuid: "unfinished-game",
						mode: "CLASSIC",
						status: "IN_PROGRESS",
						duration: 60,
						participants: [],
					},
				},
			] as any);

			mockedIsUserOnline.mockReturnValue(true);

			const result = await service.getUserHistory("user-uuid");

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				uuid: "finished-game",
				mode: "CLASSIC",
				finished: true,
				duration: 120,
			});
			expect(result[0].participants[0].user.online).toBe(true);
		});

		it("should replace a null participant score with zero", async () => {
			mockedFindMany.mockResolvedValue([
				{
					game: {
						uuid: "game-uuid",
						mode: "CLASSIC",
						status: "FINISHED",
						duration: 180,
						participants: [
							{
								userId: "user-uuid",
								score: null,
								user: {
									uuid: "user-uuid",
									username: "user",
									avatarPath: null,
								},
							},
						],
					},
				},
			] as any);

			const result = await service.getUserHistory("user-uuid");

			expect(result[0].participants[0].score).toBe(0);
		});

		it("should throw InvalidIdError when Prisma returns P2007", async () => {
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2007",
				clientVersion: "x.y.z",
			});

			mockedFindMany.mockRejectedValue(error);

			await expect(
				service.getUserHistory("invalid-uuid"),
			).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});
	});

	describe("updateUser", () => {
		it("should update user data without hashing when no password is provided", async () => {
			const updates = {
				username: "updated-user",
				email: "updated@email.com",
			};

			const updatedUser = { ...user, ...updates };
			mockedUpdate.mockResolvedValue(updatedUser as any);

			const result = await service.updateUser("user-uuid", updates);

			expect(mockedGenerateHash).not.toHaveBeenCalled();
			expect(mockedUpdate).toHaveBeenCalledWith({
				where: { uuid: "user-uuid" },
				data: updates,
				select: userDtoSelect,
			});
			expect(result).toEqual(updatedUser);
		});

		it("should hash the new password before updating", async () => {
			const updates = { password: "new-password" };
			mockedGenerateHash.mockResolvedValue("hashed-password");
			mockedUpdate.mockResolvedValue(user as any);

			await service.updateUser("user-uuid", updates);

			expect(mockedGenerateHash).toHaveBeenCalledWith("new-password");
			expect(mockedUpdate).toHaveBeenCalledWith({
				where: { uuid: "user-uuid" },
				data: { password: "hashed-password" },
				select: userDtoSelect,
			});
		});

		it("should throw DuplicateEmailError when Prisma reports duplicate email", async () => {
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
			});

			mockedUpdate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["email"]);

			await expect(
				service.updateUser("user-uuid", { email: "taken@email.com" }),
			).rejects.toMatchObject({
				name: "DuplicateEmailError",
			});
		});

		it("should throw DuplicateUsernameError when Prisma reports duplicate username", async () => {
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
			});

			mockedUpdate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["username"]);

			await expect(
				service.updateUser("user-uuid", { username: "taken-user" }),
			).rejects.toMatchObject({
				name: "DuplicateUsernameError",
			});
		});

		it("should throw UnknownUserIdError when Prisma returns P2025", async () => {
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2025",
				clientVersion: "x.y.z",
			});

			mockedUpdate.mockRejectedValue(error);

			await expect(
				service.updateUser("unknown-uuid", { username: "u" }),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});
	});

	describe("updateUserAvatar", () => {
		it("should throw UnknownUserIdError when the user does not exist", async () => {
			mockedGetUserById.mockResolvedValue(null);

			await expect(
				service.updateUserAvatar("unknown-uuid", "new-avatar.png"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
			expect(mockedUpdate).not.toHaveBeenCalled();
		});

		it("should update the avatar path and delete old avatar file", async () => {
			const userWithAvatar = { ...user, avatarPath: "old-avatar.png" };
			mockedGetUserById.mockResolvedValue(userWithAvatar as any);
			mockedUpdate.mockResolvedValue({
				...user,
				avatarPath: "new-avatar.png",
			} as any);

			const result = await service.updateUserAvatar(
				"user-uuid",
				"new-avatar.png",
			);

			expect(mockedUpdate).toHaveBeenCalledWith({
				where: { uuid: "user-uuid" },
				data: { avatarPath: "new-avatar.png" },
				select: userDtoSelect,
			});
			expect(mockedUnlinkSync).toHaveBeenCalledWith(
				`${AVATAR_DIR}/old-avatar.png`,
			);
			expect(result.avatarPath).toBe("new-avatar.png");
		});

		it("should not delete a file when the user has no previous avatar", async () => {
			mockedGetUserById.mockResolvedValue(user as any);
			mockedUpdate.mockResolvedValue({
				...user,
				avatarPath: "new-avatar.png",
			} as any);

			await service.updateUserAvatar("user-uuid", "new-avatar.png");

			expect(mockedUnlinkSync).not.toHaveBeenCalled();
		});
	});
});
