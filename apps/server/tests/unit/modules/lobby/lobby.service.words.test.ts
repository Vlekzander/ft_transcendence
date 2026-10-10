import { beforeEach, describe, expect, it } from "vitest";
import { CreateLobbySchema, MAX_CUSTOM_WORDS } from "@ft_transcendence/shared";
import { lobbiesByJoinCode, LobbyService } from "@/modules/lobby/lobby.service";
import { DEFAULT_DICTIONARY } from "@/modules/lobby/dictionary";
import {
	InvalidElementError,
	NoWordsErrorInCustomWords,
	NotHostError,
	TooManyCustomWordsError,
} from "@/errors";

const HOST = "00000000-0000-4000-8000-000000000001";
const GUEST = "00000000-0000-4000-8000-000000000002";

const sorted = (words: Iterable<string>) => [...words].sort();
const expectedWords = (level: number, custom: string[] = []) =>
	sorted(new Set([...DEFAULT_DICTIONARY[level], ...custom]));

describe("modules/lobby/lobby.service (words and dictionaries)", () => {
	const service = new LobbyService();
	const defaults = CreateLobbySchema.parse({});

	beforeEach(() => {
		lobbiesByJoinCode.clear();
	});

	describe("createLobby", () => {
		it("Builds allWords from the chosen dictionary", async () => {
			const lobby = await service.createLobby(HOST, {
				...defaults,
				usingDictionary: 1,
				customWords: "",
			});

			expect(sorted(lobby.allWords)).toEqual(expectedWords(1));
		});

		it("Adds custom words to the dictionary words without duplicates", async () => {
			const dictionaryWord = DEFAULT_DICTIONARY[1][0];
			const lobby = await service.createLobby(HOST, {
				...defaults,
				usingDictionary: 1,
				customWords: `zzcustom ${dictionaryWord}`,
			});

			expect(sorted(lobby.allWords)).toEqual(
				expectedWords(1, ["zzcustom", dictionaryWord]),
			);
			expect(new Set(lobby.allWords).size).toBe(lobby.allWords.length);
		});

		it("Uses only the custom words when no dictionary is selected", async () => {
			const lobby = await service.createLobby(HOST, {
				...defaults,
				usingDictionary: 0,
				customWords: "foo bar",
			});

			expect(sorted(lobby.allWords)).toEqual(["bar", "foo"]);
		});

		it("Accepts every existing dictionary level", async () => {
			for (const level of [1, 2, 3]) {
				lobbiesByJoinCode.clear();
				const lobby = await service.createLobby(HOST, {
					...defaults,
					usingDictionary: level,
				});

				expect(lobby.usingDictionary).toBe(level);
				expect(sorted(lobby.allWords)).toEqual(expectedWords(level));
			}
		});

		it("Rejects an unknown dictionary level without creating a lobby", async () => {
			await expect(
				service.createLobby(HOST, { ...defaults, usingDictionary: 99 }),
			).rejects.toThrow(InvalidElementError);
			expect(lobbiesByJoinCode.size).toBe(0);
		});
	});

	describe("getLobbyOfUser", () => {
		it("Returns null when the user is in no lobby", async () => {
			await expect(service.getLobbyOfUser(HOST)).resolves.toBeNull();
		});

		it("Returns the lobby of the host and of a player who joined", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, GUEST);

			await expect(service.getLobbyOfUser(HOST)).resolves.toBe(lobby);
			await expect(service.getLobbyOfUser(GUEST)).resolves.toBe(lobby);
		});

		it("Returns null again after leaving", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, GUEST);

			await service.leaveLobby(lobby.uuid, GUEST);

			await expect(service.getLobbyOfUser(GUEST)).resolves.toBeNull();
			await expect(service.getLobbyOfUser(HOST)).resolves.toBe(lobby);
		});

		it("Returns null for a banned player", async () => {
			const lobby = await service.createLobby(HOST, defaults);
			await service.joinLobby(lobby.uuid, GUEST);

			await service.banLobby(lobby.uuid, HOST, GUEST);

			await expect(service.getLobbyOfUser(GUEST)).resolves.toBeNull();
		});

		it("Allows creating a new lobby after leaving the previous one", async () => {
			const first = await service.createLobby(HOST, defaults);
			await service.leaveLobby(first.uuid, HOST);

			const second = await service.createLobby(HOST, defaults);

			expect(second.uuid).not.toBe(first.uuid);
		});
	});

	describe("updateLobby (dictionary and custom words)", () => {
		async function lobbyWith(overrides = {}) {
			return service.createLobby(HOST, { ...defaults, ...overrides });
		}

		it("Changes the dictionary and rebuilds allWords", async () => {
			const lobby = await lobbyWith({ usingDictionary: 1 });

			await service.updateLobby(lobby.uuid, { usingDictionary: 2 }, HOST);

			expect(lobby.usingDictionary).toBe(2);
			expect(sorted(lobby.allWords)).toEqual(expectedWords(2));
		});

		it("Replaces the custom words (parsed, lowercased, deduplicated)", async () => {
			const lobby = await lobbyWith({ customWords: "old" });

			await service.updateLobby(
				lobby.uuid,
				{ customWords: "New  words\nNEW" },
				HOST,
			);

			expect(lobby.customWords).toEqual(["new", "words"]);
			expect(sorted(lobby.allWords)).toEqual(
				expectedWords(lobby.usingDictionary, ["new", "words"]),
			);
			expect(lobby.allWords).not.toContain("old");
		});

		it("Clears the custom words when an empty string is sent", async () => {
			const lobby = await lobbyWith({
				usingDictionary: 1,
				customWords: "foo bar",
			});

			await service.updateLobby(lobby.uuid, { customWords: "" }, HOST);

			expect(lobby.customWords).toEqual([]);
			expect(sorted(lobby.allWords)).toEqual(expectedWords(1));
		});

		it("Switches to custom words only", async () => {
			const lobby = await lobbyWith({ customWords: "foo bar" });

			await service.updateLobby(lobby.uuid, { usingDictionary: 0 }, HOST);

			expect(lobby.usingDictionary).toBe(0);
			expect(sorted(lobby.allWords)).toEqual(["bar", "foo"]);
		});

		it("Switches from custom words only to a dictionary, keeping the custom words", async () => {
			const lobby = await lobbyWith({
				usingDictionary: 0,
				customWords: "foo",
			});

			await service.updateLobby(lobby.uuid, { usingDictionary: 3 }, HOST);

			expect(lobby.customWords).toEqual(["foo"]);
			expect(sorted(lobby.allWords)).toEqual(expectedWords(3, ["foo"]));
		});

		it("Updates words and other settings in a single call", async () => {
			const lobby = await lobbyWith();

			await service.updateLobby(
				lobby.uuid,
				{
					customWords: "foo",
					usingDictionary: 0,
					drawTime: 60,
					visibility: "PRIVATE",
				},
				HOST,
			);

			expect(lobby.drawTime).toBe(60);
			expect(lobby.visibility).toBe("PRIVATE");
			expect(sorted(lobby.allWords)).toEqual(["foo"]);
		});

		it("Does not reshuffle allWords for an unrelated update", async () => {
			const lobby = await lobbyWith({ customWords: "foo bar" });
			const before = lobby.allWords;
			const snapshot = [...before];

			await service.updateLobby(lobby.uuid, { drawTime: 60 }, HOST);

			expect(lobby.allWords).toBe(before);
			expect(lobby.allWords).toEqual(snapshot);
		});

		it("Does not reshuffle allWords when the same words are sent again", async () => {
			const lobby = await lobbyWith({
				usingDictionary: 2,
				customWords: "foo bar",
			});
			const before = lobby.allWords;

			await service.updateLobby(
				lobby.uuid,
				{ usingDictionary: 2, customWords: "foo bar" },
				HOST,
			);

			expect(lobby.allWords).toBe(before);
		});

		it("Rejects custom words only with no word, and leaves the lobby unchanged", async () => {
			const lobby = await lobbyWith({ usingDictionary: 1 });
			const snapshot = {
				usingDictionary: lobby.usingDictionary,
				customWords: [...lobby.customWords],
				allWords: lobby.allWords,
				drawTime: lobby.drawTime,
			};

			await expect(
				service.updateLobby(
					lobby.uuid,
					{ usingDictionary: 0, customWords: "", drawTime: 15 },
					HOST,
				),
			).rejects.toThrow(NoWordsErrorInCustomWords);

			expect(lobby.usingDictionary).toBe(snapshot.usingDictionary);
			expect(lobby.customWords).toEqual(snapshot.customWords);
			expect(lobby.allWords).toBe(snapshot.allWords);
			expect(lobby.drawTime).toBe(snapshot.drawTime);
		});

		it("Rejects removing all words from a custom words only lobby", async () => {
			const lobby = await lobbyWith({
				usingDictionary: 0,
				customWords: "foo",
			});

			await expect(
				service.updateLobby(lobby.uuid, { customWords: "   " }, HOST),
			).rejects.toThrow(NoWordsErrorInCustomWords);
			expect(lobby.customWords).toEqual(["foo"]);
		});

		it("Rejects switching to custom words only when there is none", async () => {
			const lobby = await lobbyWith({ customWords: "" });

			await expect(
				service.updateLobby(lobby.uuid, { usingDictionary: 0 }, HOST),
			).rejects.toThrow(NoWordsErrorInCustomWords);
		});

		it("Rejects an unknown dictionary level and leaves the lobby unchanged", async () => {
			const lobby = await lobbyWith();
			const before = lobby.allWords;

			await expect(
				service.updateLobby(
					lobby.uuid,
					{ usingDictionary: 99, drawTime: 15 },
					HOST,
				),
			).rejects.toThrow(InvalidElementError);

			expect(lobby.usingDictionary).toBe(defaults.usingDictionary);
			expect(lobby.allWords).toBe(before);
			expect(lobby.drawTime).toBe(defaults.drawTime);
		});

		it("Rejects too many custom words and leaves the lobby unchanged", async () => {
			const lobby = await lobbyWith({ customWords: "foo" });
			const tooMany = Array.from(
				{ length: MAX_CUSTOM_WORDS + 1 },
				(_, i) => `w${i}`,
			).join(" ");

			await expect(
				service.updateLobby(lobby.uuid, { customWords: tooMany }, HOST),
			).rejects.toThrow(TooManyCustomWordsError);

			expect(lobby.customWords).toEqual(["foo"]);
		});

		it("Accepts exactly the maximum number of custom words", async () => {
			const lobby = await lobbyWith();
			const max = Array.from(
				{ length: MAX_CUSTOM_WORDS },
				(_, i) => `w${i}`,
			).join(" ");

			await service.updateLobby(lobby.uuid, { customWords: max }, HOST);

			expect(lobby.customWords).toHaveLength(MAX_CUSTOM_WORDS);
		});

		it("Rejects a non-host and leaves the words unchanged", async () => {
			const lobby = await lobbyWith({ customWords: "foo" });
			await service.joinLobby(lobby.uuid, GUEST);

			await expect(
				service.updateLobby(
					lobby.uuid,
					{ customWords: "hacked", usingDictionary: 0 },
					GUEST,
				),
			).rejects.toThrow(NotHostError);

			expect(lobby.customWords).toEqual(["foo"]);
			expect(lobby.usingDictionary).toBe(defaults.usingDictionary);
		});
	});
});
