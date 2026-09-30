import { LobbyGameMode, LobbyVisibility, LobbyResponseDTO } from "@ft_transcendence/shared";

export const MAX_PLAYERS = 10;

export type LobbyEntity = {
	uuid: string;
	joinCode: string;
	hostId: string;
	mode: LobbyGameMode;
	visibility: LobbyVisibility;
	customWords: string[];
    connectedPlayers: Set<string>;
	maxPlayers: number;
};

export function toLobbyResponseDTO(lobby: LobbyEntity): LobbyResponseDTO {
	return {
		uuid: lobby.uuid,
		joinCode: lobby.joinCode,
		hostId: lobby.hostId,
		mode: lobby.mode,
		visibility: lobby.visibility,
		customWords: lobby.customWords,
		players: Array.from(lobby.connectedPlayers),
		maxPlayers: MAX_PLAYERS,
	};
}