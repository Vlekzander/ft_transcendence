import { getOnlineUsers, sendToWs } from "../../websocket.server";
import { toLobbyResponseDTO, type LobbyEntity } from "./lobby.mapper";

export function notifyLobbyUpdated(
	lobby: LobbyEntity,
	alsoNotify: string[] = [],
): void {
	const recipients = new Set([
		...lobby.connectedPlayers,
		...lobby.bannedPlayers,
		...alsoNotify,
	]);
	for (const userId of recipients)
		sendToWs(userId, {
			type: "LOBBY_UPDATED",
			lobby: toLobbyResponseDTO(lobby, lobby.hostId === userId),
		});
	notifyLobbiesChanged();
}

export function notifyLobbiesChanged(): void {
	for (const userId of getOnlineUsers())
		sendToWs(userId, { type: "LOBBIES_CHANGED" });
}
