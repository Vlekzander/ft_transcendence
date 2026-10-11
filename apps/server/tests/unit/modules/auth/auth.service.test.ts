import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma.lib";
import { compareHash, generateHash } from "@/utils/hash.util";
import { AuthService } from "@/modules/auth/auth.service";
import {
	getPrismaConstraintFields,
	userDtoSelect,
} from "@/modules/shared/shared.service";

vi.mock("@/lib/prisma.lib", () => ({
	prisma: {
		user: {
			create: vi.fn(),
			findUnique: vi.fn(),
		},
	},
}));

vi.mock("@/utils/hash.util", () => ({
	compareHash: vi.fn(),
	generateHash: vi.fn(),
}));

vi.mock("@/modules/shared/shared.service", () => ({
	getPrismaConstraintFields: vi.fn(),
	userDtoSelect: {
		uuid: true,
		email: true,
		username: true,
		avatarPath: true,
		createdAt: true,
	},
}));

const mockedCreate = vi.mocked(prisma.user.create);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedGenerateHash = vi.mocked(generateHash);
const mockedCompareHash = vi.mocked(compareHash);
const mockedGetPrismaConstraintFields = vi.mocked(getPrismaConstraintFields);

const user = {
	uuid: "user-uuid",
	email: "user@email.com",
	username: "user",
	avatarPath: null,
	createdAt: new Date("2026-01-01"),
};

describe("auth/auth.service", () => {
	const service = new AuthService();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("register", () => {
		it("Creates a user with a hashed password and userDtoSelect", async () => {
			mockedGenerateHash.mockResolvedValue("hashed-password");
			mockedCreate.mockResolvedValue(user as any);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			const result = await service.register(data);

			expect(mockedGenerateHash).toHaveBeenCalledWith("password");
			expect(mockedCreate).toHaveBeenCalledWith({
				data: {
					email: "user@email.com",
					username: "user",
					password: "hashed-password",
				},
				select: userDtoSelect,
			});
			expect(result).toEqual(user);
		});

		it("Rethrows unexpected Prisma errors", async () => {
			mockedGenerateHash.mockResolvedValue("hashed-password");
			const error = new Error("Database unavailable");
			mockedCreate.mockRejectedValue(error);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			await expect(service.register(data)).rejects.toBe(error);
		});

		it("Converts duplicate email into DuplicateEmailError", async () => {
			mockedGenerateHash.mockResolvedValue("hashed-password");
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
			});
			mockedCreate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["email"]);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			await expect(service.register(data)).rejects.toMatchObject({
				name: "DuplicateEmailError",
			});
		});

		it("Converts duplicate username into DuplicateUsernameError", async () => {
			mockedGenerateHash.mockResolvedValue("hashed-password");
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
			});
			mockedCreate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["username"]);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			await expect(service.register(data)).rejects.toMatchObject({
				name: "DuplicateUsernameError",
			});
		});

		it("Converts duplicate other field into DuplicateElementError with field name", async () => {
			mockedGenerateHash.mockResolvedValue("hashed-password");
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
			});
			mockedCreate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["phone"]);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			await expect(service.register(data)).rejects.toMatchObject({
				name: "DuplicateElementError",
				message: "phone already exists",
			});
		});

		it("Converts empty constraint fields into DuplicateElementError with 'Unknown'", async () => {
			mockedGenerateHash.mockResolvedValue("hashed-password");
			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
			});
			mockedCreate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue([]);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			await expect(service.register(data)).rejects.toMatchObject({
				name: "DuplicateElementError",
				message: "Unknown already exists",
			});
		});
	});

	describe("login", () => {
		it("Throws InvalidCredentialsError when user is not found", async () => {
			mockedFindUnique.mockResolvedValue(null);

			await expect(
				service.login({
					username: "unknown-user",
					password: "password",
				}),
			).rejects.toMatchObject({
				name: "InvalidCredentialsError",
			});
			expect(mockedFindUnique).toHaveBeenCalledWith({
				where: { username: "unknown-user" },
				select: {
					...userDtoSelect,
					password: true,
				},
			});
		});

		it("Throws InvalidCredentialsError when password does not match", async () => {
			mockedFindUnique.mockResolvedValue({
				...user,
				password: "hashed-password",
			} as any);
			mockedCompareHash.mockResolvedValue(false);

			await expect(
				service.login({ username: "user", password: "wrong-password" }),
			).rejects.toMatchObject({
				name: "InvalidCredentialsError",
			});
			expect(mockedCompareHash).toHaveBeenCalledWith(
				"wrong-password",
				"hashed-password",
			);
		});

		it("Returns user entity without password when credentials are valid", async () => {
			mockedFindUnique.mockResolvedValue({
				...user,
				password: "hashed-password",
			} as any);
			mockedCompareHash.mockResolvedValue(true);

			const result = await service.login({
				username: "user",
				password: "password",
			});

			expect(result).toEqual(user);
			expect(result).not.toHaveProperty("password");
		});
	});
});
