import {
	CreateLobbyDTO,
	MAX_CUSTOM_WORDS,
	MAX_PLAYERS,
} from "@ft_transcendence/shared";
import { v7 as uuidv7 } from "uuid";
import { LobbyEntity } from "./lobby.mapper";
import { DEFAULT_DICTIONARY } from "./dictionary";

export const lobbiesByJoinCode = new Map<string, LobbyEntity>();

function generateJoinCode(): string {
	let joinCode: string;

	do {
		joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
	} while (lobbiesByJoinCode.has(joinCode));

	return joinCode;
}

function parseCustomWords(input: string): string[] {
	if (input.trim().length === 0) return [];
	let res = input.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
	res = Array.from(new Set(res));
	if (res.length > MAX_CUSTOM_WORDS) {
		throw new Error("Too many custom words. Maximum is 100.");
	}
	return res;
}

//Fishers-Yates shuffle algorithm
function mixAllWords(allWords: Set<string>): string[] {
	const copy = Array.from(allWords);

	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));

		[copy[i], copy[j]] = [copy[j], copy[i]];
	}

	return copy;
}

export class LobbyService {
	async createLobby(
		hostId: string,
		data: CreateLobbyDTO,
	): Promise<LobbyEntity> {
		try {
			const code = generateJoinCode();
			const localCustomWords = parseCustomWords(data.customWords);
			const lobby: LobbyEntity = {
				uuid: uuidv7(),
				joinCode: code,
				hostId: hostId,
				mode: data.mode,
				visibility: data.visibility,
				connectedPlayers: new Set<string>().add(hostId),
				bannedPlayers: new Set<string>(),
				maxPlayers: MAX_PLAYERS,
				customWords: localCustomWords,
				usingDictionary: data.usingDictionary,
				drawTime: data.drawTime,
				numberOfRounds: data.numberOfRounds,
				wordChoicesPerTurn: data.wordChoicesPerTurn,
				timeToChooseWord: data.timeToChooseWord,
				allWords: mixAllWords(
					new Set(
						DEFAULT_DICTIONARY[data.usingDictionary].concat(
							localCustomWords,
						),
					),
				),
			};
			lobbiesByJoinCode.set(code, lobby);
			return lobby;
		} catch (error) {
			console.error("Error creating lobby:", error);
			throw error;
		}
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
		if (lobby.connectedPlayers.size > 1 && lobby.hostId === userId) {
			lobby.hostId = Array.from(lobby.connectedPlayers)[1];
		}
		lobby.connectedPlayers.delete(userId);
	}

	async deleteLobby(joinCode: string): Promise<void> {
		lobbiesByJoinCode.delete(joinCode);
	}
}

export const lobbyService = new LobbyService();
