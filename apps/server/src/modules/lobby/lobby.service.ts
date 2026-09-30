import { CreateLobbyDTO } from "@ft_transcendence/shared";
import { v7 as uuidv7 } from "uuid";
import { LobbyEntity, MAX_PLAYERS } from "./lobby.mapper";

export const lobbiesByJoinCode = new Map<string, LobbyEntity>();

function generateJoinCode(): string {
	let joinCode: string;

	do {
		joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
	} while (lobbiesByJoinCode.has(joinCode));

	return joinCode;
}

export class LobbyService {
	async createLobby(
		hostId: string,
		data: CreateLobbyDTO,
	): Promise<LobbyEntity> {
		//add try catch here if needed
		const code = generateJoinCode();
		const lobby: LobbyEntity = {
			uuid: uuidv7(),
			joinCode: code,
			hostId: hostId,
			mode: data.mode,
			visibility: data.visibility,
			customWords: data.customWords,
			connectedPlayers: new Set<string>(),
			maxPlayers: MAX_PLAYERS,
		};
		lobbiesByJoinCode.set(code, lobby);
		return lobby;
	}

	async listLobbies(): Promise<LobbyEntity[]> {
		return Array.from(lobbiesByJoinCode.values()).filter(
			(lobby) =>
				lobby.visibility === "PUBLIC" &&
				lobby.connectedPlayers.size < lobby.maxPlayers,
		);
	}

	async getLobbyByJoinCode(joinCode: string): Promise<LobbyEntity | null> {
		const lobby = lobbiesByJoinCode.get(joinCode);
		return lobby || null;
	}

	async getLobbyByUuid(uuid: string): Promise<LobbyEntity | null> {
		const lobby = Array.from(lobbiesByJoinCode.values()).find(
			(lobby) => lobby.uuid === uuid,
		);
		return lobby || null;
	}

	async deleteLobby(joinCode: string): Promise<void> {
		lobbiesByJoinCode.delete(joinCode);
	}
}

export const lobbyService = new LobbyService();
