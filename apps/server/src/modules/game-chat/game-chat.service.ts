import { randomUUID } from "node:crypto";
import type { GameChatEventPacket } from "@ft_transcendence/shared";
import { lobbiesByJoinCode } from "../lobby/lobby.service";
import { guessWord } from "../game/scoring.service";
import type { LobbyEntity } from "../lobby/lobby.mapper";

export class GameChatService {
	private getRoom(roomId: string): LobbyEntity {
		const room = Array.from(lobbiesByJoinCode.values()).find(
			(lobby) => lobby.uuid === roomId,
		);
		if (!room) throw new Error("Game room not found");
		return room;
	}

	getPlayers(roomId: string): string[] {
		const room = this.getRoom(roomId);
		return [...room.connectedPlayers].filter(
			(id) =>
				!room.bannedPlayers.has(id) && !room.spectatorPlayers.has(id),
		);
	}

	submit(
		roomId: string,
		sender: string,
		rawContent: unknown,
		requestId: string,
	): GameChatEventPacket {
		const room = this.getRoom(roomId);
		if (
			!room.connectedPlayers.has(sender) ||
			room.bannedPlayers.has(sender) ||
			room.spectatorPlayers.has(sender)
		)
			throw new Error("Player is not in this game");
		if (typeof rawContent !== "string")
			throw new Error("Invalid chat message");
		const content = rawContent.trim();
		if (!content || content.length > 500)
			throw new Error("Message must be 1 to 500 characters");
		const base = { roomId, sender, requestId, id: randomUUID() };
		if (guessWord(room, sender, content))
			return { type: "GAME_CHAT_GUESS", ...base };
		return { type: "GAME_CHAT_MESSAGE", ...base, content };
	}
}

export const gameChatService = new GameChatService();
