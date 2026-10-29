import {
	LobbyGameMode,
	LobbyVisibility,
	LobbyResponseDTO,
} from "@ft_transcendence/shared";
import type {
	DrawActionPacket,
	DrawStrokePacket,
	GamePhase,
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
	readyPlayers: Set<string>;
	spectatorPlayers: Set<string>;
	gameStarted: boolean;
	gameHasStarted: boolean;
	gamePhase: GamePhase;
	round: number;
	drawerIds: string[];
	wordChoices: string[];
	selectedWord: string | null;
	timerEndsAt: number | null;
	timeRemainingMs: number;
	playedThisRound: Set<string>;
	drawHistory: (DrawStrokePacket | DrawActionPacket)[];
	maxPlayers: number;
	drawTime: number;
	numberOfRounds: number;
	wordChoicesPerTurn: number;
	timeToChooseWord: number;
	allWords: string[];
};

export function toLobbyResponseDTO(
	lobby: LobbyEntity,
	includeCustomWords = false,
): LobbyResponseDTO {
	return {
		uuid: lobby.uuid,
		joinCode: lobby.joinCode,
		hostId: lobby.hostId,
		mode: lobby.mode,
		visibility: lobby.visibility,
		usingDictionary: lobby.usingDictionary,
		connectedPlayers: Array.from(lobby.connectedPlayers),
		bannedPlayers: Array.from(lobby.bannedPlayers),
		readyPlayers: Array.from(lobby.readyPlayers),
		spectatorPlayers: Array.from(lobby.spectatorPlayers),
		gameStarted: lobby.gameStarted,
		gameHasStarted: lobby.gameHasStarted,
		maxPlayers: lobby.maxPlayers,
		drawTime: lobby.drawTime,
		numberOfRounds: lobby.numberOfRounds,
		wordChoicesPerTurn: lobby.wordChoicesPerTurn,
		timeToChooseWord: lobby.timeToChooseWord,
		customWords: includeCustomWords
			? lobby.customWords.join("\n")
			: undefined,
	};
}
