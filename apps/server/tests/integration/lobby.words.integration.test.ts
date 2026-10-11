import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "@/app";
import { generateAccessToken } from "@/utils/jwt.util";
import { lobbiesByJoinCode } from "@/modules/lobby/lobby.service";

const HOST = "00000000-0000-4000-8000-000000000001";
const GUEST = "00000000-0000-4000-8000-000000000002";

const cookie = (uuid: string) => [`token=${generateAccessToken(uuid)}`];

const createLobby = (body: object = {}, as = HOST) =>
	request(app).post("/lobbies").set("Cookie", cookie(as)).send(body);

const join = (joinCode: string, as: string) =>
	request(app)
		.post("/lobbies/join")
		.set("Cookie", cookie(as))
		.send({ joinCode });

const update = (uuid: string, body: object, as = HOST) =>
	request(app)
		.put(`/lobbies/${uuid}/settings`)
		.set("Cookie", cookie(as))
		.send(body);

const get = (uuid: string, as = HOST) =>
	request(app).get(`/lobbies/${uuid}`).set("Cookie", cookie(as));

describe("lobby routes (current lobby, words and dictionaries)", () => {
	beforeAll(() => {
		vi.stubEnv("JWT_SECRET", "test-secret");
	});

	beforeEach(() => {
		lobbiesByJoinCode.clear();
	});

	describe("GET /lobbies/me", () => {
		it("Rejects unauthenticated requests with HTTP 401", async () => {
			const response = await request(app).get("/lobbies/me");

			expect(response.status).toBe(401);
		});

		it("Returns data null (HTTP 200) when the user is in no lobby", async () => {
			const response = await request(app)
				.get("/lobbies/me")
				.set("Cookie", cookie(HOST));

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ data: null });
		});

		it("Is not handled as a lobby uuid", async () => {
			const response = await request(app)
				.get("/lobbies/me")
				.set("Cookie", cookie(HOST));

			expect(response.status).not.toBe(400);
		});

		it("Returns the lobby the user created", async () => {
			const { body } = await createLobby();

			const response = await request(app)
				.get("/lobbies/me")
				.set("Cookie", cookie(HOST));

			expect(response.status).toBe(200);
			expect(response.body.data.uuid).toBe(body.data.uuid);
			expect(response.body.data).not.toHaveProperty("allWords");
		});

		it("Returns the lobby a player joined, then null after leaving", async () => {
			const { body } = await createLobby();
			await join(body.data.joinCode, GUEST);

			const inside = await request(app)
				.get("/lobbies/me")
				.set("Cookie", cookie(GUEST));
			await request(app)
				.post(`/lobbies/${body.data.uuid}/leave`)
				.set("Cookie", cookie(GUEST));
			const outside = await request(app)
				.get("/lobbies/me")
				.set("Cookie", cookie(GUEST));

			expect(inside.body.data.uuid).toBe(body.data.uuid);
			expect(outside.body).toEqual({ data: null });
		});

		it("Returns null for a banned player", async () => {
			const { body } = await createLobby();
			await join(body.data.joinCode, GUEST);
			await request(app)
				.post(`/lobbies/${body.data.uuid}/ban`)
				.set("Cookie", cookie(HOST))
				.send({ userId: GUEST });

			const response = await request(app)
				.get("/lobbies/me")
				.set("Cookie", cookie(GUEST));

			expect(response.body).toEqual({ data: null });
		});
	});

	describe("custom words visibility", () => {
		it("Gives the custom words to the host only", async () => {
			const { body } = await createLobby({ customWords: "alpha beta" });
			await join(body.data.joinCode, GUEST);

			const asHost = await get(body.data.uuid, HOST);
			const asGuest = await get(body.data.uuid, GUEST);

			expect(asHost.body.data.customWords).toBe("alpha\nbeta");
			expect(asGuest.body.data).not.toHaveProperty("customWords");
			expect(JSON.stringify(asGuest.body)).not.toContain("alpha");
		});

		it("Does not leak the custom words in the lobby list or when joining", async () => {
			const { body } = await createLobby({ customWords: "alpha beta" });

			const list = await request(app)
				.get("/lobbies")
				.set("Cookie", cookie(GUEST));
			const joined = await join(body.data.joinCode, GUEST);

			expect(JSON.stringify(list.body)).not.toContain("alpha");
			expect(JSON.stringify(joined.body)).not.toContain("alpha");
		});
	});

	describe("PUT /lobbies/:uuid/settings (dictionary and words)", () => {
		it("Updates the dictionary and the custom words", async () => {
			const { body } = await createLobby();

			const response = await update(body.data.uuid, {
				usingDictionary: 3,
				customWords: "alpha beta",
			});

			expect(response.status).toBe(200);
			expect(response.body.data.usingDictionary).toBe(3);
			expect(response.body.data.customWords).toBe("alpha\nbeta");
			expect(response.body.data).not.toHaveProperty("allWords");
		});

		it("Persists the change (visible through GET)", async () => {
			const { body } = await createLobby();
			await update(body.data.uuid, { customWords: "alpha" });

			const response = await get(body.data.uuid);

			expect(response.body.data.customWords).toBe("alpha");
		});

		it("Switches to custom words only when words are given", async () => {
			const { body } = await createLobby();

			const response = await update(body.data.uuid, {
				usingDictionary: 0,
				customWords: "alpha",
			});

			expect(response.status).toBe(200);
			expect(response.body.data.usingDictionary).toBe(0);
		});

		it("Rejects custom words only with no word (HTTP 400) and changes nothing", async () => {
			const { body } = await createLobby();

			const response = await update(body.data.uuid, {
				usingDictionary: 0,
			});
			const after = await get(body.data.uuid);

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe("NoWordsErrorInCustomWords");
			expect(after.body.data.usingDictionary).toBe(
				body.data.usingDictionary,
			);
		});

		it("Rejects an unknown dictionary level (HTTP 400)", async () => {
			const { body } = await createLobby();

			const response = await update(body.data.uuid, {
				usingDictionary: 99,
			});

			expect(response.status).toBe(400);
		});

		it("Rejects a negative or non-integer dictionary level (HTTP 400)", async () => {
			const { body } = await createLobby();

			const negative = await update(body.data.uuid, {
				usingDictionary: -1,
			});
			const decimal = await update(body.data.uuid, {
				usingDictionary: 1.5,
			});
			const text = await update(body.data.uuid, {
				usingDictionary: "easy",
			});

			expect(negative.status).toBe(400);
			expect(decimal.status).toBe(400);
			expect(text.status).toBe(400);
		});

		it("Rejects invalid custom words (HTTP 400)", async () => {
			const { body } = await createLobby();

			const digits = await update(body.data.uuid, {
				customWords: "abc123",
			});
			const notString = await update(body.data.uuid, {
				customWords: ["a"],
			});

			expect(digits.status).toBe(400);
			expect(notString.status).toBe(400);
		});

		it("Rejects more than the maximum number of custom words (HTTP 400)", async () => {
			const { body } = await createLobby();
			const tooMany = Array.from(
				{ length: 101 },
				(_, i) => `w${"a".repeat(i % 5)}x${"b".repeat(i)}`,
			).join(" ");

			const response = await update(body.data.uuid, {
				customWords: tooMany,
			});

			expect(response.status).toBe(400);
		});

		it("Rejects a non-host (HTTP 403) and keeps the words", async () => {
			const { body } = await createLobby({ customWords: "alpha" });
			await join(body.data.joinCode, GUEST);

			const response = await update(
				body.data.uuid,
				{ customWords: "hacked" },
				GUEST,
			);
			const after = await get(body.data.uuid, HOST);

			expect(response.status).toBe(403);
			expect(after.body.data.customWords).toBe("alpha");
		});

		it("Still accepts an update that does not touch the words", async () => {
			const { body } = await createLobby({ customWords: "alpha" });

			const response = await update(body.data.uuid, { drawTime: 60 });

			expect(response.status).toBe(200);
			expect(response.body.data.drawTime).toBe(60);
			expect(response.body.data.customWords).toBe("alpha");
		});
	});

	describe("POST /lobbies with dictionaries", () => {
		it("Accepts every dictionary level", async () => {
			for (const level of [1, 2, 3]) {
				lobbiesByJoinCode.clear();
				const response = await createLobby({ usingDictionary: level });

				expect(response.status).toBe(201);
				expect(response.body.data.usingDictionary).toBe(level);
			}
		});

		it("Rejects an unknown dictionary level with HTTP 400", async () => {
			const response = await createLobby({ usingDictionary: 99 });

			expect(response.status).toBe(400);
			expect(lobbiesByJoinCode.size).toBe(0);
		});

		it("Allows creating again after leaving the previous lobby", async () => {
			const first = await createLobby();
			await request(app)
				.post(`/lobbies/${first.body.data.uuid}/leave`)
				.set("Cookie", cookie(HOST));

			const second = await createLobby();

			expect(second.status).toBe(201);
		});
	});
});
