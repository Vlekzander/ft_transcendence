import { randomUUID } from "node:crypto";
import type { GameChatEventPacket } from "@ft_transcendence/shared";
import { lobbiesByJoinCode } from "../lobby/lobby.service";
import type { LobbyEntity } from "../lobby/lobby.mapper";

type Round = { word: string; guessed: Set<string> };
const normalize = (text: string) => text.normalize("NFKC").toLowerCase().trim();

export class GameChatService {
	// The lobby owns membership. Weak keys also release round state when a lobby disappears.
	private readonly rounds = new WeakMap<LobbyEntity, Round>();

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
			(id) => !room.bannedPlayers.has(id),
		);
	}

	// Server-only integration point: call once at the start/end of each round.
	setRoundWord(roomId: string, word: string | null): void {
		const room = this.getRoom(roomId);
		if (word === null) {
			this.rounds.delete(room);
			return;
		}
		const normalized = normalize(word);
		if (!normalized) throw new Error("Invalid round word");
		this.rounds.set(room, { word: normalized, guessed: new Set() });
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
			room.bannedPlayers.has(sender)
		)
			throw new Error("Player is not in this game");
		if (typeof rawContent !== "string")
			throw new Error("Invalid chat message");
		const content = rawContent.trim();
		if (!content || content.length > 500)
			throw new Error("Message must be 1 to 500 characters");
		const base = { roomId, sender, requestId, id: randomUUID() };
		const round = this.rounds.get(room);
		if (round && normalize(content).includes(round.word)) {
			if (normalize(content) !== round.word)
				throw new Error("Message contains the round word");
			if (round.guessed.has(sender))
				throw new Error("You already guessed this word");
			round.guessed.add(sender);
			return { type: "GAME_CHAT_GUESS", ...base };
		}
		return { type: "GAME_CHAT_MESSAGE", ...base, content };
	}
}

export const gameChatService = new GameChatService();
