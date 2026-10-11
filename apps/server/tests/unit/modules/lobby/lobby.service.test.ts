import { beforeEach, describe, expect, it } from "vitest";
import { CreateLobbySchema, MAX_PLAYERS } from "@ft_transcendence/shared";
import { lobbiesByJoinCode, LobbyService } from "@/modules/lobby/lobby.service";
import {
	CannotBanHostError,
	LobbyFullError,
	LobbyNotFoundError,
	NotHostError,
	TooManyCustomWordsError,
	UnauthorizedLobbyAccessError,
	UserAlreadyInLobbyError,
	UserBannedFromLobbyError,
	UserNotInLobbyError,
} from "@/errors";

const HOST = "00000000-0000-4000-8000-000000000001";
const user = (n: number) =>
	`00000000-0000-4000-8000-${String(n + 1).padStart(12, "0")}`;

describe("modules/lobby/lobby.service", () => {
	const service = new LobbyService();
	const defaults = CreateLobbySchema.parse({});

	beforeEach(() => {
		lobbiesByJoinCode.clear();
	});

	describe("createLobby", () => {
		it("Creates a lobby with the host connected and a valid join code", async () => {
			const lobby = await service.createLobby(HOST, defaults);

			expect(lobby.hostId).toBe(HOST);
			expect(lobby.connectedPlayers).toEqual(new Set([HOST]));
			expect(lobby.joinCode).toMatch(/^[A-Z0-9]{6}$/);
			expect(lobbiesByJoinCode.get(lobby.joinCode)).toBe(lobby);
		});

		it("Merges dictionary and custom words without duplicates", async () => {
			const lobby = await service.createLobby(HOST, {
				...defaults,
				usingDictionary: 0,
				customWords: "Foo bar foo",
			});

			expect(lobby.customWords).toEqual(["foo", "bar"]);
			expect([...lobby.allWords].sort()).toEqual(["bar", "foo"]);
		});

		it("Rejects too many custom words", async () => {
			const customWords = Array.from(
				{ length: 101 },
				(_, i) => `w${i}`,
			).join(" ");

			await expect(
				service.createLobby(HOST, { ...defaults, customWords }),
			).rejects.toThrow(TooManyCustomWordsError);
		});

		it("Rejects a user already in another lobby", async () => {
			await service.createLobby(HOST, defaults);

			await expect(service.createLobby(HOST, defaults)).rejects.toThrow(
				UserAlreadyInLobbyError,
			);
		});
	});

	describe("listLobbies", () => {
		it("Returns only public non-full lobbies", async () => {
			const pub = await service.createLobby(user(1), defaults);
			await service.createLobby(user(2), {
				...defaults,
				visibility: "PRIVATE",
			});
			const full = await service.createLobby(user(3), defaults);
			for (let i = 10; i < 10 + MAX_PLAYERS - 1; i++)
				await service.joinLobby(full.uuid, user(i));

			const result = await service.listLobbies();

			expect(result).toEqual([pub]);
		});
	});

	describe("joinLobby", () => {
		it("Adds the user to the lobby", async () => {
			const lobby = await service.createLobby(HOST, defaults);

			await service.joinLobby(lobby.uuid, user(1));

			expect(lobby.connectedPlayers.has(user(1))).toBe(true);
		});

		it("Throws when the lobby does not exist", async () => {
			await expect(
				service.joinLobby("00000000-0000-4000-8000-0000000000ff", HOST),
			).rejects.toThrow(LobbyNotFoundError);
		});

		it("Throws when the user is already in a lobby", async () => {
			const lobby = await service.createLobby(HOST, defaults);

			await expect(service.joinLobby(lobby.uuid, HOST)).rejects.toThrow(
				UserAlreadyInLobbyError,
			);
		});

		it("Throws when the user is already in another lobby", async () => {
			await service.createLobby(HOST, defaults);
			const other = await service.createLobby(user(1), defaults);

			await expect(service.joinLobby(other.uuid, HOST)).rejects.toThrow(
				UserAlreadyInLobbyError,
			);
		});

		it("Throws when the lobby is full", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			for (let i = 1; i < MAX_PLAYERS; i++)
				await service.joinLobby(lobby.uuid, user(i));

			await expect(
				service.joinLobby(lobby.uuid, user(99)),
			).rejects.toThrow(LobbyFullError);
		});

		it("Throws when the user is banned", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, user(1));
			await service.banLobby(lobby.uuid, HOST, user(1));

			await expect(
				service.joinLobby(lobby.uuid, user(1)),
			).rejects.toThrow(UserBannedFromLobbyError);
		});
	});

	describe("leaveLobby", () => {
		it("Removes the user from the lobby", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, user(1));

			await service.leaveLobby(lobby.uuid, user(1));

			expect(lobby.connectedPlayers).toEqual(new Set([HOST]));
			expect(lobby.hostId).toBe(HOST);
		});

		it("Deletes the lobby when the last player leaves", async () => {
			const lobby = await service.createLobby(HOST, defaults);

			await service.leaveLobby(lobby.uuid, HOST);

			expect(lobbiesByJoinCode.size).toBe(0);
		});

		it("Transfers the host to another connected player", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, user(1));
			await service.joinLobby(lobby.uuid, user(2));

			await service.leaveLobby(lobby.uuid, HOST);

			expect(lobby.hostId).toBe(user(1));
			expect(lobby.connectedPlayers.has(HOST)).toBe(false);
		});

		it("Throws when the user is not in the lobby", async () => {
			const lobby = await service.createLobby(HOST, defaults);

			await expect(
				service.leaveLobby(lobby.uuid, user(1)),
			).rejects.toThrow(UnauthorizedLobbyAccessError);
		});

		it("Throws when the lobby does not exist", async () => {
			await expect(
				service.leaveLobby(
					"00000000-0000-4000-8000-0000000000ff",
					HOST,
				),
			).rejects.toThrow(LobbyNotFoundError);
		});
	});

	describe("updateLobby", () => {
		it("Applies a partial update for the host", async () => {
			const lobby = await service.createLobby(HOST, defaults);

			await service.updateLobby(lobby.uuid, { drawTime: 60 }, HOST);

			expect(lobby.drawTime).toBe(60);
			expect(lobby.numberOfRounds).toBe(defaults.numberOfRounds);
		});

		it("Throws when the user is not the host", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, user(1));

			await expect(
				service.updateLobby(lobby.uuid, { drawTime: 60 }, user(1)),
			).rejects.toThrow(NotHostError);
		});

		it("Throws when the lobby does not exist", async () => {
			await expect(
				service.updateLobby(
					"00000000-0000-4000-8000-0000000000ff",
					{},
					HOST,
				),
			).rejects.toThrow(LobbyNotFoundError);
		});
	});

	describe("banLobby", () => {
		it("Moves the target from connected to banned players", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, user(1));

			await service.banLobby(lobby.uuid, HOST, user(1));

			expect(lobby.connectedPlayers.has(user(1))).toBe(false);
			expect(lobby.bannedPlayers.has(user(1))).toBe(true);
		});

		it("Throws when the caller is not the host", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, user(1));
			await service.joinLobby(lobby.uuid, user(2));

			await expect(
				service.banLobby(lobby.uuid, user(1), user(2)),
			).rejects.toThrow(NotHostError);
		});

		it("Throws when the host bans himself", async () => {
			const lobby = await service.createLobby(HOST, defaults);

			await expect(
				service.banLobby(lobby.uuid, HOST, HOST),
			).rejects.toThrow(CannotBanHostError);
			expect(lobby.connectedPlayers.has(HOST)).toBe(true);
		});

		it("Throws when the target is not in the lobby", async () => {
			const lobby = await service.createLobby(HOST, defaults);

			await expect(
				service.banLobby(lobby.uuid, HOST, user(1)),
			).rejects.toThrow(UserNotInLobbyError);
		});
	});

	describe("unbanLobby", () => {
		it("Removes the user from banned players", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, user(1));
			await service.banLobby(lobby.uuid, HOST, user(1));

			await service.unbanLobby(lobby.uuid, HOST, user(1));

			expect(lobby.bannedPlayers.has(user(1))).toBe(false);
			await expect(
				service.joinLobby(lobby.uuid, user(1)),
			).resolves.toBeUndefined();
		});

		it("Throws when the caller is not the host", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, user(1));

			await expect(
				service.unbanLobby(lobby.uuid, user(1), user(2)),
			).rejects.toThrow(NotHostError);
		});
	});
});
