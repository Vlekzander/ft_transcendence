import { LobbyGameMode, LobbyVisibility, LobbyResponseDTO } from "@ft_transcendence/shared";
export type LobbyEntity = {
	uuid: string;
	joinCode: string;
	hostId: string;
	mode: LobbyGameMode;
	visibility: LobbyVisibility;
	settings: Record<string, unknown>;//temporaire
	createdAt: Date;
	maxPlayers: number;
};

export function toLobbyResponseDTO(lobby: LobbyEntity): LobbyResponseDTO {
	return {
		uuid: lobby.uuid,
		joinCode: lobby.joinCode,
		hostId: lobby.hostId,
		mode: lobby.mode,
		visibility: lobby.visibility,
		settings: lobby.settings,
		createdAt: lobby.createdAt,
		maxPlayers: lobby.maxPlayers,
	};
}