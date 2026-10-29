import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma.lib";
import { compareHash } from "@/utils/hash.util";
import {
	getPrismaConstraintFields,
	SharedService,
	userDtoSelect,
} from "@/modules/shared/shared.service";

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
		it("Returns an empty array for a non-P2002 Prisma error", () => {
			const error = {
				code: "P2025",
			} as Prisma.PrismaClientKnownRequestError;

			const result = getPrismaConstraintFields(error);

			expect(result).toEqual([]);
		});

		it("Returns the constraint fields from a P2002 Prisma error", () => {
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

			const result = getPrismaConstraintFields(error);

			expect(result).toEqual(["email"]);
		});

		it("Returns an empty array when a P2002 error has no constraint fields", () => {
			const error = {
				code: "P2002",
				meta: {},
			} as unknown as Prisma.PrismaClientKnownRequestError;

			const result = getPrismaConstraintFields(error);

			expect(result).toEqual([]);
		});
	});

	describe("SharedService.getUserById", () => {
		it("Returns the user returned by Prisma with userDtoSelect", async () => {
			mockedFindUnique.mockResolvedValue(user as any);

			const result = await service.getUserById("user-uuid");

			expect(mockedFindUnique).toHaveBeenCalledWith({
				where: { uuid: "user-uuid" },
				select: userDtoSelect,
			});
			expect(result).toEqual(user);
		});

		it("Returns null when Prisma returns no user", async () => {
			mockedFindUnique.mockResolvedValue(null);

			const result = await service.getUserById("unknown-uuid");

			expect(result).toBeNull();
		});

		it("Returns null when Prisma raises error P2007", async () => {
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2007",
				clientVersion: "x.y.z",
			});

			mockedFindUnique.mockRejectedValue(error);

			const result = await service.getUserById("invalid-uuid");

			expect(result).toBeNull();
		});

		it("Rethrows unexpected Prisma errors", async () => {
			const error = new Error("Database query failed");

			mockedFindUnique.mockRejectedValue(error);

			const action = service.getUserById("user-uuid");

			await expect(action).rejects.toBe(error);
		});
	});

	describe("SharedService.validateUserPassword", () => {
		it("Returns true when the password matches", async () => {
			mockedFindUnique.mockResolvedValue({
				password: "hashed-password",
			} as any);
			mockedCompareHash.mockResolvedValue(true);

			const result = await service.validateUserPassword(
				"user-uuid",
				"password",
			);

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
			mockedFindUnique.mockResolvedValue({
				password: "hashed-password",
			} as any);
			mockedCompareHash.mockResolvedValue(false);

			const result = await service.validateUserPassword(
				"user-uuid",
				"wrong-password",
			);

			expect(result).toBe(false);
		});

		it("Throws UnknownUserIdError when no user exists", async () => {
			mockedFindUnique.mockResolvedValue(null);

			const action = service.validateUserPassword(
				"unknown-uuid",
				"password",
			);

			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("Throws InvalidIdError when Prisma raises error P2007", async () => {
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2007",
				clientVersion: "x.y.z",
			});

			mockedFindUnique.mockRejectedValue(error);

			const action = service.validateUserPassword(
				"invalid-uuid",
				"password",
			);

			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("Throws UnknownUserIdError when Prisma raises error P2025", async () => {
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2025",
				clientVersion: "x.y.z",
			});

			mockedFindUnique.mockRejectedValue(error);

			const action = service.validateUserPassword(
				"unknown-uuid",
				"password",
			);

			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});
	});

	describe("SharedService.validateUser", () => {
		it("Returns true when the user is active", async () => {
			mockedFindUnique.mockResolvedValue({
				isActive: true,
			} as any);

			const result = await service.validateUser("user-uuid");

			expect(mockedFindUnique).toHaveBeenCalledWith({
				where: {
					uuid: "user-uuid",
				},
				select: {
					isActive: true,
				},
			});
			expect(result).toBe(true);
		});

		it("Returns false when the user is inactive", async () => {
			mockedFindUnique.mockResolvedValue({
				isActive: false,
			} as any);

			const result = await service.validateUser("user-uuid");

			expect(result).toBe(false);
		});

		it("Throws InvalidIdError when Prisma raises error P2007", async () => {
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2007",
				clientVersion: "x.y.z",
			});

			mockedFindUnique.mockRejectedValue(error);

			const action = service.validateUser("invalid-uuid");

			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("Throws UnknownUserIdError when Prisma raises error P2025", async () => {
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2025",
				clientVersion: "x.y.z",
			});

			mockedFindUnique.mockRejectedValue(error);

			const action = service.validateUser("unknown-uuid");

			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("Rethrows unexpected Prisma errors", async () => {
			const error = new Error("Database query failed");

			mockedFindUnique.mockRejectedValue(error);

			const action = service.validateUser("user-uuid");

			await expect(action).rejects.toBe(error);
		});
	});
});
