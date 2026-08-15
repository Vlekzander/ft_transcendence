import { describe, it, expect, beforeEach } from "vitest";
import {
	DuplicateEmailError,
	DuplicateUsernameError,
	InvalidIdError,
	UnknownAvatarIdError,
	UnknownUserIdError,
} from "../errors/data-manager.errors";
import { prisma } from "../lib/prisma.lib";
import { DataManager, DataManagerSingleton } from "../data/DataManager";

describe("PrismaDataManager", () => {
	const dataManager: DataManager = DataManagerSingleton.getInstance();

	beforeEach(async () => {
		await prisma.$transaction([
			prisma.userOnGame.deleteMany(),
			prisma.game.deleteMany(),
			prisma.avatar.deleteMany(),
			prisma.user.deleteMany(),
		]);
	});

	describe("createUser", () => {
		it("Creates a user and returns a UserDTO", async () => {
			const user = await dataManager.createUser({
				email: "john@example.com",
				username: "john",
				password: "secret123",
				confirmPassword: "secret123",
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
				confirmPassword: "secret123",
			});

			await expect(
				dataManager.createUser({
					email: "dup@example.com",
					username: "user2",
					password: "secret456",
					confirmPassword: "secret456",
				}),
			).rejects.toThrow(DuplicateEmailError);
		});

		it("Throw an exception if the username is duplicated", async () => {
			await dataManager.createUser({
				email: "user1@example.com",
				username: "dupname",
				password: "secret123",
				confirmPassword: "secret123",
			});

			await expect(
				dataManager.createUser({
					email: "user2@example.com",
					username: "dupname",
					password: "secret456",
					confirmPassword: "secret456",
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
				confirmPassword: "secret123",
			});

			const user = await dataManager.getUserById(created.uuid);

			expect(user?.email).toEqual(created.email);
			expect(user?.username).toEqual(created.username);
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
				confirmPassword: "secret123",
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
				confirmPassword: "secret123",
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
			const avatar = await dataManager.getAvatarById(crypto.randomUUID());

			expect(avatar).toBeNull();
		});
	});

	describe("updateUserEmail", () => {
		it("Return updated user", async () => {
			const created = await dataManager.createUser({
				email: "user@example.com",
				username: "user",
				password: "secret123",
				confirmPassword: "secret123",
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
			).rejects.toThrow(InvalidIdError);
		});
	});

	describe("updateUserPassword", () => {
		it("Return updated user", async () => {
			const created = await dataManager.createUser({
				email: "user@example.com",
				username: "user",
				password: "secret123",
				confirmPassword: "secret123",
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
			).rejects.toThrow(InvalidIdError);
		});
	});

	describe("updateUserAvatar", () => {
		it("Return updated", async () => {
			const created = await dataManager.createUser({
				email: "user@example.com",
				username: "user",
				password: "secret123",
				confirmPassword: "secret123",
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

		it("Throw an exception if the user id format is invalid", async () => {
			await expect(
				dataManager.updateUserAvatar("invalid", crypto.randomUUID()),
			).rejects.toThrow(InvalidIdError);
		});
	});

	describe("deleteUser", () => {
		it("Do not throw an error", async () => {
			const created = await dataManager.createUser({
				email: "user@example.com",
				username: "user",
				password: "secret123",
				confirmPassword: "secret123",
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
				InvalidIdError,
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
			await expect(
				dataManager.deleteAvatar(crypto.randomUUID()),
			).rejects.toThrow(UnknownAvatarIdError);
		});

		it("Throw an exception if the id format is invalid", async () => {
			await expect(dataManager.deleteAvatar("invalid")).rejects.toThrow(
				InvalidIdError,
			);
		});
	});

	describe("validatePassword", () => {
		it("Validate password", async () => {
			const password = "secret123";

			const created = await dataManager.createUser({
				email: "user@example.com",
				username: "user",
				password: password,
				confirmPassword: password,
			});

			const result = await dataManager.validateUserPassword(
				created.uuid,
				password,
			);

			expect(result).toBeTruthy();
		});

		it("Throw an exception if the id is invalid", async () => {
			await expect(
				dataManager.validateUserPassword(
					crypto.randomUUID(),
					"password",
				),
			).rejects.toThrow(UnknownUserIdError);
		});

		it("Throw an exception if the id format is invalid", async () => {
			await expect(
				dataManager.validateUserPassword("invalid", "password"),
			).rejects.toThrow(InvalidIdError);
		});
	});

	describe("GetUserHistory", () => {
		it("Should return user history", async () => {
			const user = await dataManager.createUser({
				username: "Bob",
				email: "sponge@email.com",
				password: "secret123",
				confirmPassword: "secret123",
			});
			for (let i = 0; i < 5; i++) {
				const game = await prisma.game.create({
					data: { finished: true },
				}); //TODO: TEMP, replace with dataManager.createGame(...)
				await prisma.userOnGame.create({
					data: { gameId: game.uuid, userId: user.uuid },
				});
			}

			const history = await dataManager.getUserHistory(user.uuid);

			expect(history.length).toBe(5);
			history.forEach((game) => {
				expect(game.finished).toBe(true);
				expect(game.mode).toBe("SOLO");
				game.participants.forEach((participant) => {
					expect(participant.userId).toBe(user.uuid);
					expect(participant.user.uuid).toBe(user.uuid);
					expect(participant.user.username).toBe(user.username);
					expect(participant.user.avatar).toBeNull();
				});
			});
		});

		it("Should return an empty array if there is no history", async () => {
			const user = await dataManager.createUser({
				username: "Bob",
				email: "sponge@email.com",
				password: "secret123",
				confirmPassword: "secret123",
			});

			const history = await dataManager.getUserHistory(user.uuid);

			expect(history.length).toBe(0);
		});

		it("Should return an empty array if the user history is empty", async () => {
			const history = await dataManager.getUserHistory(
				crypto.randomUUID(),
			);

			expect(history.length).toBe(0);
		});

		it("Should throw an exception if the id is invalid", async () => {
			await expect(dataManager.getUserHistory("invalid")).rejects.toThrow(
				InvalidIdError,
			);
		});
		//TODO: EXCEPTION IF USER DO NOT EXIST
	});
});
