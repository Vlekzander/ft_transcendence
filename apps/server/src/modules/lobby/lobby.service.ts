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
			bannedPlayers: new Set<string>(),
			maxPlayers: MAX_PLAYERS,

			usingDictionary: data.usingDictionary,
			drawTime: data.drawTime,
			numberOfRounds: data.numberOfRounds,
			wordChoicesPerTurn: data.wordChoicesPerTurn,
			timeToChooseWord: data.timeToChooseWord,
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

	async joinLobby(lobbyUuid: string, userId: string): Promise<void> {
		const lobby = await this.getLobbyByUuid(lobbyUuid);
		if (!lobby) {
			throw new Error("Lobby not found");
		} else if (lobby.connectedPlayers.has(userId)) {
			throw new Error("User is already in the lobby");
		} else if (lobby.bannedPlayers.has(userId)) {
			throw new Error("User is banned from this lobby");
		} else if (lobby.connectedPlayers.size >= lobby.maxPlayers) {
			throw new Error("Lobby is full");
		}
		lobby.connectedPlayers.add(userId);
	}

	async leaveLobby(lobbyUuid: string, userId: string): Promise<void> {
		const lobby = await this.getLobbyByUuid(lobbyUuid);
		if (!lobby) {
			throw new Error("Lobby not found");
		} else if (!lobby.connectedPlayers.has(userId)) {
			throw new Error("User is not in the lobby");
		}
		if (
			lobby.connectedPlayers.size === 1 &&
			lobby.connectedPlayers.has(userId)
		) {
			await this.deleteLobby(lobby.joinCode);
			return;
		}
		lobby.connectedPlayers.delete(userId);
	}

	async deleteLobby(joinCode: string): Promise<void> {
		lobbiesByJoinCode.delete(joinCode);
	}
}

export const lobbyService = new LobbyService();
