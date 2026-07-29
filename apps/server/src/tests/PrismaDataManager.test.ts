import { describe, it, expect, beforeEach } from "vitest";
import { PrismaDataManager } from "../data/PrismaDataManager";
import {
	DuplicateEmailError,
	DuplicateUsernameError,
	UnknownAvatarIdError,
	UnknownUserIdError,
} from "../errors/data-manager.errors";
import { prisma } from "../lib/prisma.lib";

describe("PrismaDataManager", () => {
	let dataManager: PrismaDataManager;

	beforeEach(async () => {
		await prisma.avatar.deleteMany({});
		await prisma.user.deleteMany({});
		dataManager = new PrismaDataManager();
	});

	describe("createUser", () => {
		it("Creates a user and returns a UserDTO", async () => {
			const user = await dataManager.createUser({
				email: "john@example.com",
				username: "john",
				password: "secret123",
			});

			expect(user.uuid).toBeTypeOf("string");
			expect(user.email).toBe("john@example.com");
			expect(user.username).toBe("john");
			expect(user.avatarUuid).toBeNull();
			expect(user.createdAt).toBeInstanceOf(Date);
			expect(user).not.toHaveProperty("passwordHash");
		});

		it("Throw an exception if the email is duplicated", async () => {
			await dataManager.createUser({
				email: "dup@example.com",
				username: "user1",
				password: "secret123",
			});

			await expect(
				dataManager.createUser({
					email: "dup@example.com",
					username: "user2",
					password: "secret456",
				}),
			).rejects.toThrow(DuplicateEmailError);
		});

		it("Throw an exception if the username is duplicated", async () => {
			await dataManager.createUser({
				email: "user1@example.com",
				username: "dupname",
				password: "secret123",
			});

			await expect(
				dataManager.createUser({
					email: "user2@example.com",
					username: "dupname",
					password: "secret456",
				}),
			).rejects.toThrow(DuplicateUsernameError);
		});
	});

	describe("createAvatar", () => {
		it("Create an avatar to the database", async () => {
			const avatar = await dataManager.createAvatar("/avatars/cat.png");

			expect(avatar.uuid).toBeTypeOf("string");
			expect(avatar.path).toBe("/avatars/cat.png");
		});
	});

	describe("getUserById", () => {
		it("Returns the user by id", async () => {
			const created = await dataManager.createUser({
				email: "findme@example.com",
				username: "findme",
				password: "secret123",
			});

			const user = await dataManager.getUserById(created.uuid);

			expect(user).toEqual(created);
			expect(user).not.toHaveProperty("passwordHash");
		});

		it("Returns null if id does not exist", async () => {
			const user = await dataManager.getUserById(crypto.randomUUID());

			expect(user).toBeNull();
		});

		it("Returns null if id is not an uuid", async () => {
			const user = await dataManager.getUserById("no-uuid");

			expect(user).toBeNull();
		});
	});

	describe("getUserByEmail", () => {
		it("Returns the user by email", async () => {
			await dataManager.createUser({
				email: "mail@example.com",
				username: "mailuser",
				password: "secret123",
			});

			const user = await dataManager.getUserByEmail("mail@example.com");

			expect(user).not.toBeNull();
			expect(user?.email).toBe("mail@example.com");
			expect(user).not.toHaveProperty("passwordHash");
		});

		it("Returns null if email does not exist", async () => {
			const user = await dataManager.getUserByEmail(
				"missing@example.com",
			);

			expect(user).toBeNull();
		});
		it("Returns null if email format is invalid", async () => {
			const user = await dataManager.getUserByEmail("invalid");

			expect(user).toBeNull();
		});
	});

	describe("getUserByUsername", () => {
		it("Returns the user by username", async () => {
			await dataManager.createUser({
				email: "name@example.com",
				username: "targetuser",
				password: "secret123",
			});

			const user = await dataManager.getUserByUsername("targetuser");

			expect(user).not.toBeNull();
			expect(user?.username).toBe("targetuser");
			expect(user).not.toHaveProperty("passwordHash");
		});

		it("Returns null if username does not exist", async () => {
			const user = await dataManager.getUserByUsername("unknown-user");

			expect(user).toBeNull();
		});
	});

	describe("getAvatarById", () => {
		it("Returns the avatar by id", async () => {
			const created = await dataManager.createAvatar("/avatars/dog.png");

			const avatar = await dataManager.getAvatarById(created.uuid);

			expect(avatar).toEqual(created);
		});

		it("Returns null if avatar does not exist", async () => {
			const avatar = await dataManager.getAvatarById("missing-avatar");

			expect(avatar).toBeNull();
		});
	});

	describe("updateUserEmail", () => {
		it("Return updated user", async () => {
			const created = await dataManager.createUser({
				email: "user@example.com",
				username: "user",
				password: "secret123",
			});

			const updated = await dataManager.updateUserEmail(
				created.uuid,
				"updated@example.com",
			);

			expect(updated.email).toBe("updated@example.com");
		});

		it("Throw an exception if the id is invalid", async () => {
			await expect(
				dataManager.updateUserEmail(
					crypto.randomUUID(),
					"updated@example.com",
				),
			).rejects.toThrow(UnknownUserIdError);
		});

		it("Throw an exception if the id format is invalid", async () => {
			await expect(
				dataManager.updateUserEmail("invalid", "updated@example.com"),
			).rejects.toThrow(UnknownUserIdError);
		});
	});

	describe("updateUserPassword", () => {
		it("Return updated user", async () => {
			const created = await dataManager.createUser({
				email: "user@example.com",
				username: "user",
				password: "secret123",
			});

			const updated = await dataManager.updateUserPassword(
				created.uuid,
				"superpassword",
			);

			expect(updated).toBeTruthy();
		});

		it("Throw an exception if the id is invalid", async () => {
			await expect(
				dataManager.updateUserPassword(
					crypto.randomUUID(),
					"superpassword",
				),
			).rejects.toThrow(UnknownUserIdError);
		});

		it("Throw an exception if the id format is invalid", async () => {
			await expect(
				dataManager.updateUserPassword("invalid", "superpassword"),
			).rejects.toThrow(UnknownUserIdError);
		});
	});

	describe("updateUserAvatar", () => {
		it("Return updated", async () => {
			const created = await dataManager.createUser({
				email: "user@example.com",
				username: "user",
				password: "secret123",
			});

			const avatar = await dataManager.createAvatar("/avatars/cat.png");
			const updated = await dataManager.updateUserAvatar(
				created.uuid,
				avatar.uuid,
			);

			expect(updated).not.toBeNull();
			expect(updated?.avatarUuid).toBe(avatar.uuid);
		});

		it("Throw an exception if the id is invalid", async () => {
			await expect(
				dataManager.updateUserAvatar(
					crypto.randomUUID(),
					crypto.randomUUID(),
				),
			).rejects.toThrow(UnknownUserIdError);
		});

		it("Throw an exception if the id foramt is invalid", async () => {
			await expect(
				dataManager.updateUserAvatar("invalid", crypto.randomUUID()),
			).rejects.toThrow(UnknownUserIdError);
		});

		it("Returns null if id format is invalid", async () => {
			const user = await dataManager.getUserById("no-uuid");

			expect(user).toBeNull();
		});
	});

	describe("deleteUser", () => {
		it("Do not throw an error", async () => {
			const created = await dataManager.createUser({
				email: "user@example.com",
				username: "user",
				password: "secret123",
			});

			await dataManager.deleteUser(created.uuid);
			const deleted = await dataManager.getUserById(created.uuid);

			expect(deleted).toBeNull();
		});

		it("Throw an exception if the id is invalid", async () => {
			await expect(
				dataManager.deleteUser(crypto.randomUUID()),
			).rejects.toThrow(UnknownUserIdError);
		});

		it("Throw an exception if the id format is invalid", async () => {
			await expect(dataManager.deleteUser("invalid")).rejects.toThrow(
				UnknownUserIdError,
			);
		});
	});

	describe("deleteAvatar", () => {
		it("Do not throw an error", async () => {
			const avatar = await dataManager.createAvatar("/avatars/cat.png");

			await dataManager.deleteAvatar(avatar.uuid);
			const deleted = await dataManager.getAvatarById(avatar.uuid);

			expect(deleted).toBeNull();
		});
		it("Throw an exception if the id is invalid", async () => {
			await expect(dataManager.deleteAvatar("invalid")).rejects.toThrow(
				UnknownAvatarIdError,
			);
		});
	});
});
