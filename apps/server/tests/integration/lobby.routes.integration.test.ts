import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "@/app";
import { generateAccessToken } from "@/utils/jwt.util";
import { lobbiesByJoinCode } from "@/modules/lobby/lobby.service";

const HOST = "00000000-0000-4000-8000-000000000001";
const GUEST = "00000000-0000-4000-8000-000000000002";
const OTHER = "00000000-0000-4000-8000-000000000003";

const cookie = (uuid: string) => [`token=${generateAccessToken(uuid)}`];

async function createLobby(body: object = {}, as = HOST) {
	return request(app).post("/lobbies").set("Cookie", cookie(as)).send(body);
}

describe("lobby routes", () => {
	beforeAll(() => {
		vi.stubEnv("JWT_SECRET", "test-secret");
	});

	beforeEach(() => {
		lobbiesByJoinCode.clear();
	});

	it("Rejects unauthenticated requests with HTTP 401", async () => {
		const response = await request(app).get("/lobbies");

		expect(response.status).toBe(401);
	});

	describe("POST /lobbies", () => {
		it("Creates a lobby with default settings and hides the words", async () => {
			const response = await createLobby();

			expect(response.status).toBe(201);
			expect(response.body.data).toEqual(
				expect.objectContaining({
					hostId: HOST,
					connectedPlayers: [HOST],
					bannedPlayers: [],
					joinCode: expect.stringMatching(/^[A-Z0-9]{6}$/),
					wordChoicesPerTurn: expect.any(Number),
				}),
			);
			expect(response.body.data).not.toHaveProperty("allWords");
		});

		it("Rejects invalid settings with HTTP 400", async () => {
			const response = await createLobby({ drawTime: 7 });

			expect(response.status).toBe(400);
		});

		it("Requires custom words when no dictionary is used", async () => {
			const response = await createLobby({ usingDictionary: 0 });

			expect(response.status).toBe(400);
		});

		it("Rejects a user already in a lobby with HTTP 409", async () => {
			await createLobby();

			const response = await createLobby();

			expect(response.status).toBe(409);
		});
	});

	describe("GET /lobbies", () => {
		it("Lists only public lobbies", async () => {
			await createLobby({}, HOST);
			await createLobby({ visibility: "PRIVATE" }, GUEST);

			const response = await request(app)
				.get("/lobbies")
				.set("Cookie", cookie(OTHER));

			expect(response.status).toBe(200);
			expect(response.body.data).toHaveLength(1);
			expect(response.body.data[0].hostId).toBe(HOST);
		});
	});

	describe("GET /lobbies/:uuid", () => {
		it("Returns the lobby to a connected player", async () => {
			const { body } = await createLobby();

			const response = await request(app)
				.get(`/lobbies/${body.data.uuid}`)
				.set("Cookie", cookie(HOST));

			expect(response.status).toBe(200);
			expect(response.body.data.uuid).toBe(body.data.uuid);
		});

		it("Rejects a non-member with HTTP 403", async () => {
			const { body } = await createLobby();

			const response = await request(app)
				.get(`/lobbies/${body.data.uuid}`)
				.set("Cookie", cookie(GUEST));

			expect(response.status).toBe(403);
		});

		it("Returns HTTP 404 for an unknown lobby", async () => {
			const response = await request(app)
				.get("/lobbies/00000000-0000-4000-8000-0000000000ff")
				.set("Cookie", cookie(HOST));

			expect(response.status).toBe(404);
		});

		it("Returns HTTP 400 for an invalid uuid", async () => {
			const response = await request(app)
				.get("/lobbies/not-a-uuid")
				.set("Cookie", cookie(HOST));

			expect(response.status).toBe(400);
		});
	});

	describe("POST /lobbies/join", () => {
		it("Joins a lobby with its join code", async () => {
			const { body } = await createLobby();

			const response = await request(app)
				.post("/lobbies/join")
				.set("Cookie", cookie(GUEST))
				.send({ joinCode: body.data.joinCode });

			expect(response.status).toBe(200);
			expect(response.body.data.connectedPlayers).toEqual([HOST, GUEST]);
		});

		it("Returns HTTP 404 for an unknown join code", async () => {
			const response = await request(app)
				.post("/lobbies/join")
				.set("Cookie", cookie(GUEST))
				.send({ joinCode: "ZZZZZZ" });

			expect(response.status).toBe(404);
		});

		it("Returns HTTP 400 for a malformed join code", async () => {
			const response = await request(app)
				.post("/lobbies/join")
				.set("Cookie", cookie(GUEST))
				.send({ joinCode: "abc" });

			expect(response.status).toBe(400);
		});
	});

	describe("POST /lobbies/:uuid/leave", () => {
		it("Removes the user and deletes the empty lobby", async () => {
			const { body } = await createLobby();

			const response = await request(app)
				.post(`/lobbies/${body.data.uuid}/leave`)
				.set("Cookie", cookie(HOST));

			expect(response.status).toBe(200);
			expect(lobbiesByJoinCode.size).toBe(0);
		});

		it("Returns HTTP 403 when the user is not in the lobby", async () => {
			const { body } = await createLobby();

			const response = await request(app)
				.post(`/lobbies/${body.data.uuid}/leave`)
				.set("Cookie", cookie(GUEST));

			expect(response.status).toBe(403);
		});
	});

	describe("PUT /lobbies/:uuid/settings", () => {
		it("Lets the host partially update the settings", async () => {
			const { body } = await createLobby();

			const response = await request(app)
				.put(`/lobbies/${body.data.uuid}/settings`)
				.set("Cookie", cookie(HOST))
				.send({ drawTime: 60 });

			expect(response.status).toBe(200);
			expect(response.body.data.drawTime).toBe(60);
			expect(response.body.data.numberOfRounds).toBe(
				body.data.numberOfRounds,
			);
		});

		it("Rejects a non-host with HTTP 403", async () => {
			const { body } = await createLobby();
			await request(app)
				.post("/lobbies/join")
				.set("Cookie", cookie(GUEST))
				.send({ joinCode: body.data.joinCode });

			const response = await request(app)
				.put(`/lobbies/${body.data.uuid}/settings`)
				.set("Cookie", cookie(GUEST))
				.send({ drawTime: 60 });

			expect(response.status).toBe(403);
		});

		it("Rejects invalid values with HTTP 400", async () => {
			const { body } = await createLobby();

			const response = await request(app)
				.put(`/lobbies/${body.data.uuid}/settings`)
				.set("Cookie", cookie(HOST))
				.send({ drawTime: 7 });

			expect(response.status).toBe(400);
		});
	});

	describe("ban / unban", () => {
		async function lobbyWithGuest() {
			const { body } = await createLobby();
			await request(app)
				.post("/lobbies/join")
				.set("Cookie", cookie(GUEST))
				.send({ joinCode: body.data.joinCode });
			return body.data;
		}

		it("Bans a player, who can no longer join, then unbans him", async () => {
			const lobby = await lobbyWithGuest();

			const ban = await request(app)
				.post(`/lobbies/${lobby.uuid}/ban`)
				.set("Cookie", cookie(HOST))
				.send({ userId: GUEST });
			const rejoin = await request(app)
				.post("/lobbies/join")
				.set("Cookie", cookie(GUEST))
				.send({ joinCode: lobby.joinCode });
			const unban = await request(app)
				.post(`/lobbies/${lobby.uuid}/unban`)
				.set("Cookie", cookie(HOST))
				.send({ userId: GUEST });
			const rejoinAfter = await request(app)
				.post("/lobbies/join")
				.set("Cookie", cookie(GUEST))
				.send({ joinCode: lobby.joinCode });

			expect(ban.status).toBe(200);
			expect(rejoin.status).toBe(403);
			expect(unban.status).toBe(200);
			expect(rejoinAfter.status).toBe(200);
		});

		it("Rejects a non-host with HTTP 403", async () => {
			const lobby = await lobbyWithGuest();

			const response = await request(app)
				.post(`/lobbies/${lobby.uuid}/ban`)
				.set("Cookie", cookie(GUEST))
				.send({ userId: HOST });

			expect(response.status).toBe(403);
		});

		it("Prevents the host from banning himself", async () => {
			const lobby = await lobbyWithGuest();

			const response = await request(app)
				.post(`/lobbies/${lobby.uuid}/ban`)
				.set("Cookie", cookie(HOST))
				.send({ userId: HOST });

			expect(response.status).toBe(400);
		});

		it("Returns HTTP 404 when the target is not in the lobby", async () => {
			const lobby = await lobbyWithGuest();

			const response = await request(app)
				.post(`/lobbies/${lobby.uuid}/ban`)
				.set("Cookie", cookie(HOST))
				.send({ userId: OTHER });

			expect(response.status).toBe(404);
		});
	});
});
