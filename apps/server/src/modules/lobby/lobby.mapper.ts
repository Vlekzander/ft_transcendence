import {
	LobbyGameMode,
	LobbyVisibility,
	LobbyResponseDTO,
} from "@ft_transcendence/shared";

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
	allWords: string[];
};

export function toLobbyResponseDTO(lobby: LobbyEntity): LobbyResponseDTO {
	return {
		uuid: lobby.uuid,
		joinCode: lobby.joinCode,
		hostId: lobby.hostId,
		mode: lobby.mode,
		visibility: lobby.visibility,
		usingDictionary: lobby.usingDictionary,
		connectedPlayers: Array.from(lobby.connectedPlayers),
		bannedPlayers: Array.from(lobby.bannedPlayers),
		maxPlayers: lobby.maxPlayers,
		drawTime: lobby.drawTime,
		numberOfRounds: lobby.numberOfRounds,
		wordChoicesPerTurn: lobby.wordChoicesPerTurn,
		timeToChooseWord: lobby.timeToChooseWord,
	};
}
