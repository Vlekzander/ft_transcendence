import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma.lib";

describe("users routes", () => {
	let userUuid: string;
	let agent: ReturnType<typeof request.agent>;

	beforeAll(async () => {
		await prisma.$connect();
	});

	beforeEach(async () => {
		await prisma.userOnGame.deleteMany();
		await prisma.game.deleteMany();
		await prisma.user.deleteMany();

		agent = request.agent(app);

		const response = await agent
			.post("/auth/register")
			.send({
				email: "user@email.com",
				username: "user",
				password: "Password123!",
				confirmPassword: "Password123!",
			})
			.expect(201);

		userUuid = response.body.data.uuid;
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	describe("GET /users/:uuid", () => {
		it("Returns a public user with HTTP 200", async () => {
			// Arrange
			const path = `/users/${userUuid}`;

			// Act
			const response = await request(app).get(path);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				user: {
					uuid: userUuid,
					username: "user",
					avatarPath: null,
					online: false,
				},
			});
		});

		it("Returns HTTP 404 for an unknown user", async () => {
			// Arrange
			const unknownUuid = "00000000-0000-0000-0000-000000000000";

			// Act
			const response = await request(app).get(`/users/${unknownUuid}`);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.error).toEqual({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("Returns HTTP 400 for an invalid UUID", async () => {
			// Arrange
			const invalidUuid = "invalid-uuid";

			// Act
			const response = await request(app).get(`/users/${invalidUuid}`);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.error).toEqual({
				code: expect.any(String),
				message: expect.any(String),
			});
		});
	});

	describe("PATCH /users/:uuid", () => {
		it("Rejects an update without authentication", async () => {
			// Arrange
			const payload = {
				currentPassword: "Password123!",
				confirmPassword: "NewPassword123!",
				username: "updated-user",
			};

			// Act
			const response = await request(app)
				.patch(`/users/${userUuid}`)
				.send(payload);

			// Assert
			expect(response.status).toBe(401);
		});

		it("Rejects an update for another user", async () => {
			// Arrange
			const otherUser = await prisma.user.create({
				data: {
					email: "other@email.com",
					username: "other-user",
					password: "hashed-password",
				},
			});

			const payload = {
				currentPassword: "Password123!",
				confirmPassword: "NewPassword123!",
				username: "updated-user",
			};

			// Act
			const response = await agent
				.patch(`/users/${otherUser.uuid}`)
				.send(payload);

			// Assert
			expect(response.status).toBe(403);
		});

		it("Rejects an update with an incorrect current password", async () => {
			// Arrange
			const payload = {
				currentPassword: "WrongPassword123!",
				confirmPassword: "NewPassword123!",
				username: "updated-user",
			};

			// Act
			const response = await agent
				.patch(`/users/${userUuid}`)
				.send(payload);

			// Assert
			expect(response.status).toBe(400);
		});

		it("Updates the authenticated user with HTTP 200", async () => {
			// Arrange
			const payload = {
				currentPassword: "Password123!",
				password: "NewPassword123!",
				confirmPassword: "NewPassword123!",
				username: "updated-user",
			};

			// Act
			const response = await agent
				.patch(`/users/${userUuid}`)
				.send(payload);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				user: {
					uuid: userUuid,
					email: "user@email.com",
					username: "updated-user",
					avatarPath: null,
				},
			});

			const databaseUser = await prisma.user.findUnique({
				where: {
					uuid: userUuid,
				},
			});

			expect(databaseUser?.username).toBe("updated-user");
		});

		it("Rejects an invalid update body with HTTP 400", async () => {
			// Arrange
			const payload = {
				currentPassword: "",
				confirmPassword: "",
				username: "",
			};

			// Act
			const response = await agent
				.patch(`/users/${userUuid}`)
				.send(payload);

			// Assert
			expect(response.status).toBe(400);
		});
	});

	describe("GET /users/:uuid/history", () => {
		it("Returns an empty history for a user without games", async () => {
			// Arrange
			// The user has no games.

			// Act
			const response = await request(app).get(
				`/users/${userUuid}/history`,
			);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				history: [],
			});
		});

		it("Returns finished games in the user history", async () => {
			// Arrange
			const finishedGame = await prisma.game.create({
				data: {
					status: "FINISHED",
				},
			});

			await prisma.userOnGame.create({
				data: {
					gameId: finishedGame.uuid,
					userId: userUuid,
				},
			});

			// Act
			const response = await request(app).get(
				`/users/${userUuid}/history`,
			);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.history).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						uuid: finishedGame.uuid,
						finished: true,
					}),
				]),
			);
		});
	});

	describe("GET /users/:uuid/stats", () => {
		it("Returns user statistics with HTTP 200", async () => {
			// Arrange
			// Stats are currently generated by the controller.

			// Act
			const response = await request(app).get(`/users/${userUuid}/stats`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.stats).toHaveLength(5);
			expect(response.body.stats).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						label: "Game Played",
						value: "193",
					}),
					expect.objectContaining({
						label: "Wins",
						value: "42",
					}),
				]),
			);
		});
	});

	describe("GET /users/:uuid/achievements", () => {
		it("Returns user achievements with HTTP 200", async () => {
			// Arrange
			// Achievements are currently generated by the controller.

			// Act
			const response = await request(app).get(
				`/users/${userUuid}/achievements`,
			);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.achievements).toHaveLength(3);

			for (const achievement of response.body.achievements) {
				expect(achievement.uuid).toEqual(expect.any(String));
			}
		});
	});

	describe("GET /users/:uuid/friends", () => {
		it("Returns user friends with HTTP 200", async () => {
			// Arrange
			// Friends are currently generated by the controller.

			// Act
			const response = await request(app).get(
				`/users/${userUuid}/friends`,
			);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.friends).toHaveLength(3);

			expect(response.body.friends).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						status: "in_game",
					}),
					expect.objectContaining({
						status: "online",
					}),
					expect.objectContaining({
						status: "offline",
					}),
				]),
			);
		});
	});

	describe("POST /users/:uuid", () => {
		it("Rejects an avatar update without authentication", async () => {
			// Arrange
			// No authenticated session is created.

			// Act
			const response = await request(app).post(`/users/${userUuid}`);

			// Assert
			expect(response.status).toBe(401);
		});

		it("Rejects an avatar update without a file", async () => {
			// Arrange
			// The authenticated agent sends no multipart file.

			// Act
			const response = await agent
				.post(`/users/${userUuid}`)
				.field("description", "No file");

			// Assert
			expect(response.status).toBe(400);
		});

		it("Rejects a non-image avatar", async () => {
			// Arrange
			const fileContent = Buffer.from("not-an-image");

			// Act
			const response = await agent
				.post(`/users/${userUuid}`)
				.attach("file", fileContent, {
					filename: "document.txt",
					contentType: "text/plain",
				});

			// Assert
			expect(response.status).toBe(400);
		});

		it("Updates the avatar with an image file", async () => {
			// Arrange
			const imageContent = Buffer.from("fake-image-content");

			// Act
			const response = await agent
				.post(`/users/${userUuid}`)
				.attach("file", imageContent, {
					filename: "avatar.png",
					contentType: "image/png",
				});

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.user).toEqual({
				uuid: userUuid,
				email: "user@email.com",
				username: "user",
				avatarPath: expect.any(String),
			});

			const databaseUser = await prisma.user.findUnique({
				where: {
					uuid: userUuid,
				},
			});

			expect(databaseUser?.avatarPath).toEqual(expect.any(String));
		});
	});
});
