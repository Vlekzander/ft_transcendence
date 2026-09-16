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
	});

	describe("getUserHistory", () => {
		it("Returns only finished games", async () => {
			// Arrange
			mockedFindMany.mockResolvedValue([
				{
					game: {
						uuid: "finished-game",
						mode: "CLASSIC",
						status: "FINISHED",
						duration: 120,
						participants: [],
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

			// Act
			const result = await service.getUserHistory("user-uuid");

			// Assert
			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				uuid: "finished-game",
				mode: "CLASSIC",
				finished: true,
				duration: 120,
			});
		});

		it("Maps game participants into history participants", async () => {
			// Arrange
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
								score: 42,
								user: {
									uuid: "user-uuid",
									username: "user",
									avatarPath: "avatar.png",
								},
							},
						],
					},
				},
			] as any);

			// Act
			const result = await service.getUserHistory("user-uuid");

			// Assert
			expect(result).toEqual([
				{
					uuid: "game-uuid",
					mode: "CLASSIC",
					finished: true,
					duration: 180,
					participants: [
						{
							userId: "user-uuid",
							score: 42,
							user: {
								uuid: "user-uuid",
								username: "user",
								avatarPath: "avatar.png",
								online: false,
							},
						},
					],
				},
			]);
		});

		it("Replaces a null participant score with zero", async () => {
			// Arrange
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

			// Act
			const result = await service.getUserHistory("user-uuid");

			// Assert
			expect(result[0].participants[0].score).toBe(0);
		});

		it("Queries the user game history in descending game order", async () => {
			// Arrange
			mockedFindMany.mockResolvedValue([]);

			// Act
			await service.getUserHistory("user-uuid");

			// Assert
			expect(mockedFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						userId: "user-uuid",
					},
					orderBy: {
						gameId: "desc",
					},
				}),
			);
		});

		it("Throws InvalidIdError when Prisma returns P2007", async () => {
			// Arrange
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2007",
				clientVersion: "x.y.z",
			});

			mockedFindMany.mockRejectedValue(error);

			// Act
			const action = service.getUserHistory("invalid-uuid");

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("Rethrows unexpected Prisma errors", async () => {
			// Arrange
			const error = new Error("Database unavailable");

			mockedFindMany.mockRejectedValue(error);

			// Act
			const action = service.getUserHistory("user-uuid");

			// Assert
			await expect(action).rejects.toBe(error);
		});
	});

	describe("updateUser", () => {
		it("Updates user data without hashing when no password is provided", async () => {
			// Arrange
			const updates = {
				username: "updated-user",
				email: "updated@email.com",
			};

			const updatedUser = {
				...user,
				...updates,
			};

			mockedUpdate.mockResolvedValue(updatedUser as any);

			// Act
			const result = await service.updateUser("user-uuid", updates);

			// Assert
			expect(mockedGenerateHash).not.toHaveBeenCalled();

			expect(mockedUpdate).toHaveBeenCalledWith({
				where: {
					uuid: "user-uuid",
				},
				data: updates,
				select: userDtoSelect,
			});

			expect(result).toEqual(updatedUser);
		});

		it("Hashes the new password before updating the user", async () => {
			// Arrange
			const updates = {
				password: "new-password",
			};

			mockedGenerateHash.mockResolvedValue("hashed-password");
			mockedUpdate.mockResolvedValue(user as any);

			// Act
			await service.updateUser("user-uuid", updates);

			// Assert
			expect(mockedGenerateHash).toHaveBeenCalledWith("new-password");
			expect(mockedUpdate).toHaveBeenCalledWith({
				where: {
					uuid: "user-uuid",
				},
				data: {
					password: "hashed-password",
				},
				select: userDtoSelect,
			});
		});

		it("Throws InvalidIdError when Prisma returns P2007", async () => {
			// Arrange
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2007",
				clientVersion: "x.y.z",
			});

			mockedUpdate.mockRejectedValue(error);

			// Act
			const action = service.updateUser("invalid-uuid", {
				username: "updated-user",
			});

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("Throws UnknownUserIdError when Prisma returns P2025", async () => {
			// Arrange
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2025",
				clientVersion: "x.y.z",
			});

			mockedUpdate.mockRejectedValue(error);

			// Act
			const action = service.updateUser("unknown-uuid", {
				username: "updated-user",
			});

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("Throws DuplicateEmailError when Prisma reports a duplicate email", async () => {
			// Arrange
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
			});

			mockedUpdate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["email"]);

			// Act
			const action = service.updateUser("user-uuid", {
				email: "existing@email.com",
			});

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "DuplicateEmailError",
			});
		});

		it("Throws DuplicateUsernameError when Prisma reports a duplicate username", async () => {
			// Arrange
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
			});

			mockedUpdate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["username"]);

			// Act
			const action = service.updateUser("user-uuid", {
				username: "existing-user",
			});

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "DuplicateUsernameError",
			});
		});

		it("Rethrows unexpected update errors", async () => {
			// Arrange
			const error = new Error("Database unavailable");

			mockedUpdate.mockRejectedValue(error);

			// Act
			const action = service.updateUser("user-uuid", {
				username: "updated-user",
			});

			// Assert
			await expect(action).rejects.toBe(error);
		});
	});

	describe("updateUserAvatar", () => {
		it("Throws UnknownUserIdError when the user does not exist", async () => {
			// Arrange
			mockedGetUserById.mockResolvedValue(null);

			// Act
			const action = service.updateUserAvatar(
				"unknown-uuid",
				"new-avatar.png",
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});

			expect(mockedUpdate).not.toHaveBeenCalled();
		});

		it("Updates the avatar path", async () => {
			// Arrange
			mockedGetUserById.mockResolvedValue(user as any);

			const updatedUser = {
				...user,
				avatarPath: "new-avatar.png",
			};

			mockedUpdate.mockResolvedValue(updatedUser as any);

			// Act
			const result = await service.updateUserAvatar(
				"user-uuid",
				"new-avatar.png",
			);

			// Assert
			expect(mockedUpdate).toHaveBeenCalledWith({
				where: {
					uuid: "user-uuid",
				},
				data: {
					avatarPath: "new-avatar.png",
				},
				select: userDtoSelect,
			});

			expect(result).toEqual(updatedUser);
		});

		it("Deletes the previous avatar after updating the user", async () => {
			// Arrange
			const userWithAvatar = {
				...user,
				avatarPath: "old-avatar.png",
			};

			mockedGetUserById.mockResolvedValue(userWithAvatar as any);
			mockedUpdate.mockResolvedValue({
				...user,
				avatarPath: "new-avatar.png",
			} as any);

			// Act
			await service.updateUserAvatar("user-uuid", "new-avatar.png");

			// Assert
			expect(mockedUnlinkSync).toHaveBeenCalledWith(
				`${AVATAR_DIR}/old-avatar.png`,
			);
		});

		it("Does not delete a file when the user has no previous avatar", async () => {
			// Arrange
			mockedGetUserById.mockResolvedValue(user as any);
			mockedUpdate.mockResolvedValue({
				...user,
				avatarPath: "new-avatar.png",
			} as any);

			// Act
			await service.updateUserAvatar("user-uuid", "new-avatar.png");

			// Assert
			expect(mockedUnlinkSync).not.toHaveBeenCalled();
		});

		it("Keeps the update successful when deleting the previous avatar fails", async () => {
			// Arrange
			vi.spyOn(console, "error").mockImplementation(() => undefined);
			const userWithAvatar = {
				...user,
				avatarPath: "old-avatar.png",
			};

			mockedGetUserById.mockResolvedValue(userWithAvatar as any);
			mockedUpdate.mockResolvedValue({
				...user,
				avatarPath: "new-avatar.png",
			} as any);

			mockedUnlinkSync.mockImplementation(() => {
				throw new Error("File not found");
			});

			// Act
			const result = await service.updateUserAvatar(
				"user-uuid",
				"new-avatar.png",
			);

			// Assert
			expect(result.avatarPath).toBe("new-avatar.png");
		});

		it("Throws InvalidIdError when Prisma returns P2007", async () => {
			// Arrange
			mockedGetUserById.mockResolvedValue(user as any);

			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2007",
				clientVersion: "x.y.z",
			});

			mockedUpdate.mockRejectedValue(error);

			// Act
			const action = service.updateUserAvatar(
				"invalid-uuid",
				"new-avatar.png",
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("Throws UnknownUserIdError when Prisma returns P2025", async () => {
			// Arrange
			mockedGetUserById.mockResolvedValue(user as any);

			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2025",
				clientVersion: "x.y.z",
			});

			mockedUpdate.mockRejectedValue(error);

			// Act
			const action = service.updateUserAvatar(
				"unknown-uuid",
				"new-avatar.png",
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});
	});
});
