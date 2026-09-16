import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma.lib";
import { compareHash, generateHash } from "@/utils/hash.util";
import { AuthService } from "@/modules/auth/auth.service";

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

const mockedCreate = vi.mocked(prisma.user.create);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedGenerateHash = vi.mocked(generateHash);
const mockedCompareHash = vi.mocked(compareHash);

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
		it("Creates a user with a hashed password", async () => {
			// Arrange
			mockedGenerateHash.mockResolvedValue("hashed-password");
			mockedCreate.mockResolvedValue(user as any);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			// Act
			const result = await service.register(data);

			// Assert
			expect(mockedGenerateHash).toHaveBeenCalledWith("password");

			expect(mockedCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					data: {
						email: "user@email.com",
						username: "user",
						password: "hashed-password",
					},
				}),
			);

			expect(result).toEqual(user);
		});

		it("Rethrows unexpected Prisma errors", async () => {
			// Arrange
			mockedGenerateHash.mockResolvedValue("hashed-password");

			const error = new Error("Database unavailable");
			mockedCreate.mockRejectedValue(error);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			// Act
			const result = service.register(data);

			// Assert
			await expect(result).rejects.toBe(error);
		});

		it("Converts a duplicate email error into DuplicateEmailError", async () => {
			// Arrange
			mockedGenerateHash.mockResolvedValue("hashed-password");

			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
				meta: {
					driverAdapterError: {
						cause: {
							constraint: {
								fields: ["email"],
							},
						},
					},
				},
			});

			mockedCreate.mockRejectedValue(error);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			// Act
			const result = service.register(data);

			// Assert
			await expect(result).rejects.toMatchObject({
				name: "DuplicateEmailError",
			});
		});

		it("Converts a duplicate username error into DuplicateUsernameError", async () => {
			// Arrange
			mockedGenerateHash.mockResolvedValue("hashed-password");

			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
				meta: {
					driverAdapterError: {
						cause: {
							constraint: {
								fields: ["username"],
							},
						},
					},
				},
			});

			mockedCreate.mockRejectedValue(error);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			// Act
			const result = service.register(data);

			// Assert
			await expect(result).rejects.toMatchObject({
				name: "DuplicateUsernameError",
			});
		});

		it("Converts a duplicate error into DuplicateElementError", async () => {
			// Arrange
			mockedGenerateHash.mockResolvedValue("hashed-password");

			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
				meta: {
					driverAdapterError: {
						cause: {
							constraint: {
								fields: ["anything"],
							},
						},
					},
				},
			});

			mockedCreate.mockRejectedValue(error);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			// Act
			const result = service.register(data);

			// Assert
			await expect(result).rejects.toMatchObject({
				name: "DuplicateElementError",
			});
		});

		it("Converts a duplicate unknown error into DuplicateElementError", async () => {
			// Arrange
			mockedGenerateHash.mockResolvedValue("hashed-password");

			const error = new Prisma.PrismaClientKnownRequestError("Message", {
				code: "P2002",
				clientVersion: "x.y.z",
				meta: {
					driverAdapterError: {
						cause: {
							constraint: {
								//NO FIELDS
							},
						},
					},
				},
			});

			mockedCreate.mockRejectedValue(error);

			const data = {
				email: "user@email.com",
				username: "user",
				password: "password",
				confirmPassword: "password",
			};

			// Act
			const result = service.register(data);

			// Assert
			await expect(result).rejects.toMatchObject({
				name: "DuplicateElementError",
			});
		});
	});

	describe("login", () => {
		it("Throws InvalidCredentialsError when the user does not exist", async () => {
			// Arrange
			mockedFindUnique.mockResolvedValue(null);

			// Act
			const result = service.login({
				username: "unknown-user",
				password: "password",
			});

			// Assert
			await expect(result).rejects.toMatchObject({
				name: "InvalidCredentialsError",
			});
		});

		it("Throws InvalidCredentialsError when the password is incorrect", async () => {
			// Arrange
			mockedFindUnique.mockResolvedValue({
				...user,
				password: "hashed-password",
			} as any);

			mockedCompareHash.mockResolvedValue(false);

			// Act
			const result = service.login({
				username: "user",
				password: "wrong-password",
			});

			// Assert
			await expect(result).rejects.toMatchObject({
				name: "InvalidCredentialsError",
			});

			expect(mockedCompareHash).toHaveBeenCalledWith(
				"wrong-password",
				"hashed-password",
			);
		});

		it("Returns the user without the password when the credentials are valid", async () => {
			// Arrange
			mockedFindUnique.mockResolvedValue({
				...user,
				password: "hashed-password",
			} as any);

			mockedCompareHash.mockResolvedValue(true);

			// Act
			const result = await service.login({
				username: "user",
				password: "password",
			});

			// Assert
			expect(result).toEqual(user);
			expect(result).not.toHaveProperty("password");
		});
	});
});
