import { assertTestDatabase } from "./database";
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
		assertTestDatabase();
		await prisma.friendship.deleteMany();
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
		it("should return a public user with HTTP 200", async () => {
			const response = await request(app).get(`/users/${userUuid}`);

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

		it("should return HTTP 404 for an unknown user", async () => {
			const unknownUuid = "00000000-0000-0000-0000-000000000000";

			const response = await request(app).get(`/users/${unknownUuid}`);

			expect(response.status).toBe(404);
			expect(response.body.error).toEqual({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("should return HTTP 404 for an invalid UUID", async () => {
			const invalidUuid = "invalid-uuid";

			const response = await request(app).get(`/users/${invalidUuid}`);

			expect(response.status).toBe(404);
			expect(response.body.error).toEqual({
				code: expect.any(String),
				message: expect.any(String),
			});
		});
	});

	describe("PATCH /users/:uuid", () => {
		it("should reject an update without authentication", async () => {
			const payload = {
				currentPassword: "Password123!",
				confirmPassword: "NewPassword123!",
				username: "updated-user",
			};

			const response = await request(app)
				.patch(`/users/${userUuid}`)
				.send(payload);

			expect(response.status).toBe(401);
		});

		it("should reject an update for another user", async () => {
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

			const response = await agent
				.patch(`/users/${otherUser.uuid}`)
				.send(payload);

			expect(response.status).toBe(403);
		});

		it("should reject an update with an incorrect current password", async () => {
			const payload = {
				currentPassword: "WrongPassword123!",
				confirmPassword: "NewPassword123!",
				username: "updated-user",
			};

			const response = await agent
				.patch(`/users/${userUuid}`)
				.send(payload);

			expect(response.status).toBe(400);
		});

		it("should update the authenticated user with HTTP 200", async () => {
			const payload = {
				currentPassword: "Password123!",
				password: "NewPassword123!",
				confirmPassword: "NewPassword123!",
				username: "updated-user",
			};

			const response = await agent
				.patch(`/users/${userUuid}`)
				.send(payload);

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

		it("should reject an invalid update body with HTTP 400", async () => {
			const payload = {
				currentPassword: "",
				confirmPassword: "",
				username: "",
			};

			const response = await agent
				.patch(`/users/${userUuid}`)
				.send(payload);

			expect(response.status).toBe(400);
		});
	});

	describe("GET /users/:uuid/history", () => {
		it("should return an empty history for a user without games", async () => {
			const response = await request(app).get(
				`/users/${userUuid}/history`,
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				history: [],
			});
		});

		it("should return finished games in the user history", async () => {
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

			const response = await request(app).get(
				`/users/${userUuid}/history`,
			);

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
		it("should return user statistics with HTTP 200", async () => {
			const response = await request(app).get(`/users/${userUuid}/stats`);

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
		it("should return user achievements with HTTP 200", async () => {
			const response = await request(app).get(
				`/users/${userUuid}/achievements`,
			);

			expect(response.status).toBe(200);
			expect(response.body.achievements).toHaveLength(9);

			for (const achievement of response.body.achievements) {
				expect(achievement.uuid).toEqual(expect.any(String));
			}
		});
	});

	describe("POST /users/:uuid", () => {
		it("should reject an avatar update without authentication", async () => {
			const response = await request(app).post(`/users/${userUuid}`);

			expect(response.status).toBe(401);
		});

		it("should reject an avatar update without a file", async () => {
			const response = await agent
				.post(`/users/${userUuid}`)
				.field("description", "No file");

			expect(response.status).toBe(400);
		});

		it("should reject a non-image avatar upload", async () => {
			const fileContent = Buffer.from("not-an-image");

			const response = await agent
				.post(`/users/${userUuid}`)
				.attach("file", fileContent, {
					filename: "document.txt",
					contentType: "text/plain",
				});

			expect(response.status).toBe(400);
		});

		it("should update the avatar with an image file", async () => {
			const imageContent = Buffer.from("fake-image-content");

			const response = await agent
				.post(`/users/${userUuid}`)
				.attach("file", imageContent, {
					filename: "avatar.png",
					contentType: "image/png",
				});

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

	describe("GET /users/:uuid/friends", () => {
		it("should return an empty list when the user has no friends", async () => {
			const response = await request(app).get(
				`/users/${userUuid}/friends`,
			);

			expect(response.status).toBe(200);
			expect(response.body.friends).toHaveLength(0);
		});

		it("should return the list of accepted friends", async () => {
			const friend = await prisma.user.create({
				data: {
					email: "friend@email.com",
					username: "friend",
					password: "hashed-password",
				},
			});

			await prisma.friendship.create({
				data: {
					senderId: userUuid,
					receiverId: friend.uuid,
					status: "ACCEPTED",
				},
			});

			const response = await request(app).get(
				`/users/${userUuid}/friends`,
			);

			expect(response.status).toBe(200);
			expect(response.body.friends).toHaveLength(1);
			expect(response.body.friends[0].user).toMatchObject({
				uuid: friend.uuid,
				username: "friend",
			});
		});
	});

	describe("GET /users/:uuid/friends/pending", () => {
		it("should reject request without authentication", async () => {
			const response = await request(app).get(
				`/users/${userUuid}/friends/pending`,
			);

			expect(response.status).toBe(401);
		});

		it("should return pending friend requests received by the user", async () => {
			const requester = await prisma.user.create({
				data: {
					email: "requester@email.com",
					username: "requester",
					password: "hashed-password",
				},
			});

			await prisma.friendship.create({
				data: {
					senderId: requester.uuid,
					receiverId: userUuid,
					status: "PENDING",
				},
			});

			const response = await agent.get(
				`/users/${userUuid}/friends/pending`,
			);

			expect(response.status).toBe(200);
			expect(response.body.pendingRequests).toHaveLength(1);
			expect(response.body.pendingRequests[0].sender).toMatchObject({
				uuid: requester.uuid,
				username: "requester",
			});
		});
	});

	describe("GET /users/:uuid/friends/sent", () => {
		it("should reject request without authentication", async () => {
			const response = await request(app).get(
				`/users/${userUuid}/friends/sent`,
			);

			expect(response.status).toBe(401);
		});

		it("should return pending requests sent by the user", async () => {
			const target = await prisma.user.create({
				data: {
					email: "target@email.com",
					username: "target",
					password: "hashed-password",
				},
			});

			await prisma.friendship.create({
				data: {
					senderId: userUuid,
					receiverId: target.uuid,
					status: "PENDING",
				},
			});

			const response = await agent.get(`/users/${userUuid}/friends/sent`);

			expect(response.status).toBe(200);
			expect(response.body.sentRequests).toHaveLength(1);
			expect(response.body.sentRequests[0].receiver).toMatchObject({
				uuid: target.uuid,
				username: "target",
			});
		});
	});

	describe("POST /users/:uuid/friends", () => {
		it("should send a friend request with HTTP 200", async () => {
			const target = await prisma.user.create({
				data: {
					email: "target@email.com",
					username: "target",
					password: "hashed-password",
				},
			});

			const response = await agent
				.post(`/users/${userUuid}/friends`)
				.send({ receiverId: target.uuid });

			expect(response.status).toBe(200);
			expect(response.body.sentRequest.receiver).toMatchObject({
				uuid: target.uuid,
				username: "target",
			});
		});

		it("should reject sending a friend request to oneself", async () => {
			const response = await agent
				.post(`/users/${userUuid}/friends`)
				.send({ receiverId: userUuid });

			expect(response.status).toBe(400);
		});
	});

	describe("PATCH /users/:uuid/friends", () => {
		it("should accept a friend request with HTTP 200", async () => {
			const senderUser = await prisma.user.create({
				data: {
					email: "sender@email.com",
					username: "sender",
					password: "hashed-password",
				},
			});

			const requestRecord = await prisma.friendship.create({
				data: {
					senderId: senderUser.uuid,
					receiverId: userUuid,
					status: "PENDING",
				},
			});

			const response = await agent
				.patch(`/users/${userUuid}/friends`)
				.send({ requestId: requestRecord.uuid });

			expect(response.status).toBe(200);
			expect(response.body.friend.user).toMatchObject({
				uuid: senderUser.uuid,
				username: "sender",
			});
		});
	});

	describe("DELETE /users/:uuid/friends", () => {
		it("should delete a friend request and respond with HTTP 204", async () => {
			const senderUser = await prisma.user.create({
				data: {
					email: "sender@email.com",
					username: "sender",
					password: "hashed-password",
				},
			});

			const requestRecord = await prisma.friendship.create({
				data: {
					senderId: senderUser.uuid,
					receiverId: userUuid,
					status: "PENDING",
				},
			});

			const response = await agent
				.delete(`/users/${userUuid}/friends`)
				.send({ requestId: requestRecord.uuid });

			expect(response.status).toBe(204);

			const deletedRecord = await prisma.friendship.findUnique({
				where: { uuid: requestRecord.uuid },
			});
			expect(deletedRecord).toBeNull();
		});
	});

	describe("GET /users", () => {
		it("should search and return matching users by prefix", async () => {
			await prisma.user.create({
				data: {
					email: "alice@email.com",
					username: "Alice",
					password: "hashed-password",
				},
			});

			const response = await request(app)
				.get("/users")
				.query({ query: "ali" });

			expect(response.status).toBe(200);
			expect(response.body.users).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						username: "Alice",
					}),
				]),
			);
		});
	});
});
