import {
	LobbyGameMode,
	LobbyVisibility,
	LobbyResponseDTO,
} from "@ft_transcendence/shared";

import { DEFAULT_DICTIONARY } from "./dictionary";

export const MAX_PLAYERS = 10;

export type LobbyEntity = {
	uuid: string;
	joinCode: string;
	hostId: string;
	mode: LobbyGameMode;
	visibility: LobbyVisibility;
	usingDictionary: number;
	customWords: string[];
	connectedPlayers: Set<string>;
	bannedPlayers: Set<string>;
	maxPlayers: number;
	drawTime: number;
	numberOfRounds: number;
	wordChoicesPerTurn: number;
	timeToChooseWord: number;
};

export function toLobbyResponseDTO(lobby: LobbyEntity): LobbyResponseDTO {
	return {
		uuid: lobby.uuid,
		joinCode: lobby.joinCode,
		hostId: lobby.hostId,
		mode: lobby.mode,
		visibility: lobby.visibility,
		usingDictionary: lobby.usingDictionary,
		customWords: lobby.customWords,
		connectedPlayers: Array.from(lobby.connectedPlayers),
		bannedPlayers: Array.from(lobby.bannedPlayers),
		maxPlayers: MAX_PLAYERS,
		drawTime: 60,
		numberOfRounds: lobby.numberOfRounds,
		wordChoicesPerTurn: lobby.wordChoicesPerTurn,
		timeToChooseWord: lobby.timeToChooseWord,

		dictionary: DEFAULT_DICTIONARY[lobby.usingDictionary],
	};
}
