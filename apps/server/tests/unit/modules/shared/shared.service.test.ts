import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma.lib";
import { compareHash } from "@/utils/hash.util";
import {
	getPrismaConstraintFields,
	SharedService,
} from "@/modules/shared/shared.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

vi.mock("@/lib/prisma.lib", () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
		},
	},
}));

vi.mock("@/utils/hash.util", () => ({
	compareHash: vi.fn(),
}));

const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedCompareHash = vi.mocked(compareHash);

const user = {
	uuid: "user-uuid",
	email: "user@email.com",
	username: "user",
	avatarPath: null,
	createdAt: new Date("2026-01-01"),
};

describe("modules/shared/shared.service", () => {
	const service = new SharedService();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getPrismaConstraintFields", () => {
		it("Returns an empty array for a non-unique Prisma error", () => {
			// Arrange
			const error = {
				code: "P2025",
			} as Prisma.PrismaClientKnownRequestError;

			// Act
			const result = getPrismaConstraintFields(error);

			// Assert
			expect(result).toEqual([]);
		});

		it("Returns the constraint fields from a P2002 Prisma error", () => {
			// Arrange
			const error = {
				code: "P2002",
				meta: {
					driverAdapterError: {
						cause: {
							constraint: {
								fields: ["email"],
							},
						},
					},
				},
			} as unknown as Prisma.PrismaClientKnownRequestError;

			// Act
			const result = getPrismaConstraintFields(error);

			// Assert
			expect(result).toEqual(["email"]);
		});

		it("Returns an empty array when a P2002 error has no constraint fields", () => {
			// Arrange
			const error = {
				code: "P2002",
				meta: {},
			} as unknown as Prisma.PrismaClientKnownRequestError;

			// Act
			const result = getPrismaConstraintFields(error);

			// Assert
			expect(result).toEqual([]);
		});
	});

	describe("SharedService.getUserById", () => {
		it("Returns the user returned by Prisma", async () => {
			// Arrange
			mockedFindUnique.mockResolvedValue(user as any);

			// Act
			const result = await service.getUserById("user-uuid");

			// Assert
			expect(result).toEqual(user);
		});

		it("Returns null when Prisma returns no user", async () => {
			// Arrange
			mockedFindUnique.mockResolvedValue(null);

			// Act
			const result = await service.getUserById("unknown-uuid");

			// Assert
			expect(result).toBeNull();
		});

		it("Returns null when Prisma raises error P2007", async () => {
			// Arrange
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2007",
				clientVersion: "x.y.z",
			});

			mockedFindUnique.mockRejectedValue(error);

			// Act
			const result = await service.getUserById("invalid-uuid");

			// Assert
			expect(result).toBeNull();
		});

		it("Rethrows unknown Prisma errors", async () => {
			// Arrange
			const error = {
				code: "P0",
			} as Prisma.PrismaClientKnownRequestError;

			mockedFindUnique.mockRejectedValue(error);

			// Act
			const action = service.getUserById("user-uuid");

			// Assert
			await expect(action).rejects.toBe(error);
		});
	});

	describe("SharedService.validateUserPassword", () => {
		it("Returns true when the password matches", async () => {
			// Arrange
			mockedFindUnique.mockResolvedValue({
				password: "hashed-password",
			} as any);
			mockedCompareHash.mockResolvedValue(true);

			// Act
			const result = await service.validateUserPassword(
				"user-uuid",
				"password",
			);

			// Assert
			expect(mockedFindUnique).toHaveBeenCalledWith({
				where: {
					uuid: "user-uuid",
				},
				select: {
					password: true,
				},
			});
			expect(mockedCompareHash).toHaveBeenCalledWith(
				"password",
				"hashed-password",
			);
			expect(result).toBe(true);
		});

		it("Returns false when the password does not match", async () => {
			// Arrange
			mockedFindUnique.mockResolvedValue({
				password: "hashed-password",
			} as any);
			mockedCompareHash.mockResolvedValue(false);

			// Act
			const result = await service.validateUserPassword(
				"user-uuid",
				"wrong-password",
			);

			// Assert
			expect(result).toBe(false);
		});

		it("Throws UnknownUserIdError when no user exists", async () => {
			// Arrange
			mockedFindUnique.mockResolvedValue(null);

			// Act
			const action = service.validateUserPassword(
				"unknown-uuid",
				"password",
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("Throws InvalidIdError when Prisma raises error P2007", async () => {
			// Arrange
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2007",
				clientVersion: "x.y.z",
			});

			mockedFindUnique.mockRejectedValue(error);

			// Act
			const action = service.validateUserPassword(
				"invalid-uuid",
				"password",
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("Throws UnknownUserIdError when Prisma raises error P2025", async () => {
			// Arrange
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2025",
				clientVersion: "x.y.z",
			});

			mockedFindUnique.mockRejectedValue(error);

			// Act
			const action = service.validateUserPassword(
				"unknown-uuid",
				"password",
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});
	});
});
