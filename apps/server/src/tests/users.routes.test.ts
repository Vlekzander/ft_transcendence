import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma.lib";
import { DataManager, DataManagerSingleton } from "../data/DataManager";
import { GameHistoryEntry, PublicUserDTO } from "@ft_transcendence/shared";
import app from "../app";
import request from "supertest";
import { generateAccessToken } from "../utils/jwt.util";

describe("users.routes", () => {
	const dataManager: DataManager = DataManagerSingleton.getInstance();

	beforeEach(async () => {
		await prisma.$transaction([
			prisma.userOnGame.deleteMany(),
			prisma.game.deleteMany(),
			prisma.user.deleteMany(),
		]);
	});

	describe("/users/:uuid", () => {
		it("GET Should retrieve the user public datas", async () => {
			const user = await dataManager.createUser({
				username: "bob",
				email: "sponge@email.com",
				password: "secret123",
				confirmPassword: "secret123",
			});

			const response = await request(app).get(`/users/${user.uuid}`);

			const data: PublicUserDTO = response.body?.user;

			expect(data.uuid).toBe(user.uuid);
			expect(data.username).toBe(user.username);
			expect(data.avatarPath).toBeNull();
		});

		it("GET Should fail with unknown user", async () => {
			const response = await request(app).get(
				`/users/${crypto.randomUUID()}`,
			);

			expect(response.status).toBe(404);
			expect(response.body?.error.code).toBe("UnknownUserIdError");
		});

		it("PATCH Should update user", async () => {
			const user = await dataManager.createUser({
				username: "bob",
				email: "sponge@email.com",
				password: "secret123",
				confirmPassword: "secret123",
			});

			const token = generateAccessToken(user.uuid);
			const response = await request(app)
				.patch(`/users/${user.uuid}`)
				.send({
					username: "patrick",
					email: "patrick@email.com",
					currentPassword: "secret123",
				})
				.set("Accept", "application/json")
				.set("Cookie", [`token=${token}`]);
			expect(response.status).toBe(200);
			expect(response.body?.user?.uuid).toBe(user.uuid);
			expect(response.body?.user?.username).toBe("patrick");
			expect(response.body?.user?.email).toBe("patrick@email.com");
		});

		it("PATCH Should throw an exception if no ownership", async () => {
			const user = await dataManager.createUser({
				username: "bob",
				email: "sponge@email.com",
				password: "secret123",
				confirmPassword: "secret123",
			});

			const token = generateAccessToken(crypto.randomUUID());
			const response = await request(app)
				.patch(`/users/${user.uuid}`)
				.send({
					username: "patrick",
					email: "patrick@email.com",
					currentPassword: "secret123",
				})
				.set("Accept", "application/json")
				.set("Cookie", [`token=${token}`]);

			expect(response.status).toBe(403);
			expect(response.body?.error.code).toBe("CannotEditUserError");
		});

		it("PATCH Should throw an exception if no token", async () => {
			const user = await dataManager.createUser({
				username: "bob",
				email: "sponge@email.com",
				password: "secret123",
				confirmPassword: "secret123",
			});

			const response = await request(app)
				.patch(`/users/${user.uuid}`)
				.send({
					username: "patrick",
					email: "patrick@email.com",
					currentPassword: "secret123",
				})
				.set("Accept", "application/json");

			expect(response.status).toBe(401);
			expect(response.body?.error.code).toBe("RequireAuthError");
		});
	});

	describe("/users/:uuid/history", () => {
		it("GET Should retrieve the user history", async () => {
			const user = await dataManager.createUser({
				username: "bob",
				email: "sponge@email.com",
				password: "secret123",
				confirmPassword: "secret123",
			});
			for (let i = 0; i < 5; i++) {
				const game = await prisma.game.create({
					data: { status: "FINISHED" },
				}); //TODO: TEMP, replace with dataManager.createGame(...)
				await prisma.userOnGame.create({
					data: { gameId: game.uuid, userId: user.uuid },
				});
			}

			const response = await request(app).get(
				`/users/${user.uuid}/history`,
			);

			const history: GameHistoryEntry[] = response.body?.history;

			expect(history.length).toBe(5);
			history.forEach((game) => {
				expect(game.mode).toBe("SOLO");
				expect(game.finished).toBe(true);
				expect(game.duration).toBe(0);
				game.participants.forEach((participant) => {
					expect(participant.userId).toBe(user.uuid);
					expect(participant.user.uuid).toBe(user.uuid);
					expect(participant.user.username).toBe(user.username);
					expect(participant.user.avatarPath).toBeNull();
				});
			});
		});

		it("GET should fail with invalid id", async () => {
			const response = await request(app).get("/users/nobody/history");

			expect(response.status).toBe(400);
			expect(response.body?.error.code).toBe("InvalidIdError");
		});
	});
});
