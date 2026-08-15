import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma.lib";
import { DataManager, DataManagerSingleton } from "../data/DataManager";
import { GameHistoryEntry } from "@ft_transcendence/shared";
import app from "../app";
import request from "supertest";

describe("users.routes", () => {
	const dataManager: DataManager = DataManagerSingleton.getInstance();

	beforeEach(async () => {
		await prisma.$transaction([
			prisma.userOnGame.deleteMany(),
			prisma.game.deleteMany(),
			prisma.avatar.deleteMany(),
			prisma.user.deleteMany(),
		]);
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
					data: { finished: true },
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

		it("GET should fail with invalid id", async () => {
			const response = await request(app).get("/users/nobody/history");

			expect(response.status).toBe(400);
			expect(response.body?.error.code).toBe("InvalidIdError");
		});
	});
});
