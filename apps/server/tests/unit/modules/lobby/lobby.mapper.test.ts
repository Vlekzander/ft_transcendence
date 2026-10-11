import { beforeEach, describe, expect, it } from "vitest";
import {
	CreateLobbySchema,
	LobbyResponseSchema,
} from "@ft_transcendence/shared";
import { lobbiesByJoinCode, LobbyService } from "@/modules/lobby/lobby.service";
import { toLobbyResponseDTO } from "@/modules/lobby/lobby.mapper";

const HOST = "00000000-0000-4000-8000-000000000001";
const GUEST = "00000000-0000-4000-8000-000000000002";

describe("modules/lobby/lobby.mapper", () => {
	const service = new LobbyService();
	const defaults = CreateLobbySchema.parse({});

	beforeEach(() => {
		lobbiesByJoinCode.clear();
	});

	it("Never exposes the words of the game by default", async () => {
		const lobby = await service.createLobby(HOST, {
			...defaults,
			customWords: "secret words",
		});

		const dto = toLobbyResponseDTO(lobby);

		expect(dto).not.toHaveProperty("allWords");
		expect(dto.customWords).toBeUndefined();
		expect(JSON.stringify(dto)).not.toContain("secret");
	});

	it("Includes the custom words, one per line, when asked", async () => {
		const lobby = await service.createLobby(HOST, {
			...defaults,
			customWords: "secret words",
		});

		const dto = toLobbyResponseDTO(lobby, true);

		expect(dto.customWords).toBe("secret\nwords");
		expect(dto).not.toHaveProperty("allWords");
	});

	it("Gives an empty string for the host when there is no custom word", async () => {
		const lobby = await service.createLobby(HOST, defaults);

		expect(toLobbyResponseDTO(lobby, true).customWords).toBe("");
	});

	it("Converts player sets to arrays", async () => {
		const lobby = await service.createLobby(HOST, defaults);
		await service.joinLobby(lobby.uuid, GUEST);
		await service.banLobby(lobby.uuid, HOST, GUEST);

		const dto = toLobbyResponseDTO(lobby);

		expect(dto.connectedPlayers).toEqual([HOST]);
		expect(dto.bannedPlayers).toEqual([GUEST]);
	});

	it("Produces an object that satisfies LobbyResponseSchema", async () => {
		const lobby = await service.createLobby(HOST, {
			...defaults,
			customWords: "foo bar",
		});

		expect(
			LobbyResponseSchema.safeParse(toLobbyResponseDTO(lobby, true))
				.success,
		).toBe(true);
		expect(
			LobbyResponseSchema.safeParse(toLobbyResponseDTO(lobby)).success,
		).toBe(true);
	});
});
