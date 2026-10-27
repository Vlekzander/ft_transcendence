import { WebSocket } from "ws";
import z from "zod";
import { LobbyResponseSchema } from "./lobby.schemas";

export const ErrorPacketSchema = z.object({
	type: z.literal("ERROR"),
	text: z.string(),
});

export const MessagePacketSchema = z.object({
	type: z.literal("MESSAGE"),
	text: z.string(),
});

export const SendMessagePacketSchema = z.object({
	type: z.literal("SEND_MESSAGE"),
	receiver: z.string().min(1, "The receiver is required"),
	content: z.string().min(1, "The content cannot be empty"),
});

export const ReceiveMessagePacketSchema = z.object({
	type: z.literal("RECEIVE_MESSAGE"),
	uuid: z.string(),
	sender: z.string(),
	receiver: z.string(),
	content: z.string(),
});

export const JoinGamePacketSchema = z.object({
	type: z.literal("JOIN_GAME"),
	lobbyUuid: z.string(),
});

export const RetryGameSavePacketSchema = z.object({
	type: z.literal("RETRY_GAME_SAVE"),
	lobbyUuid: z.string(),
});

export const ChooseWordPacketSchema = z.object({
	type: z.literal("CHOOSE_WORD"),
	lobbyUuid: z.string(),
	word: z.string(),
});

export const DrawStrokePacketSchema = z.object({
	type: z.literal("DRAW_STROKE"),
	lobbyUuid: z.string(),
	from: z.object({ x: z.number(), y: z.number() }),
	to: z.object({ x: z.number(), y: z.number() }),
	color: z.string(),
	size: z.number(),
	eraser: z.boolean(),
});

export const DrawActionSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("SHAPE"),
		mode: z.union([z.literal("rectangle"), z.literal("circle")]),
		from: z.object({ x: z.number(), y: z.number() }),
		to: z.object({ x: z.number(), y: z.number() }),
		color: z.string(),
		size: z.number(),
		eraser: z.boolean(),
	}),
	z.object({
		kind: z.literal("FILL"),
		x: z.number(),
		y: z.number(),
		color: z.string(),
	}),
	z.object({ kind: z.literal("CLEAR") }),
]);

export const DrawActionPacketSchema = z.object({
	type: z.literal("DRAW_ACTION"),
	lobbyUuid: z.string(),
	action: DrawActionSchema,
});

export const GameStatePacketSchema = z.object({
	type: z.literal("GAME_STATE"),
	lobbyUuid: z.string(),
	phase: z.union([
		z.literal("WAITING"),
		z.literal("CHOOSING"),
		z.literal("DRAWING"),
		z.literal("PAUSED"),
		z.literal("ROUND_END"),
		z.literal("FINISHED"),
	]),
	round: z.number(),
	totalRounds: z.number(),
	playerNumber: z.number(),
	totalPlayers: z.number(),
	drawerId: z.string().nullable(),
	choices: z.array(z.string()),
	selectedWord: z.string().nullable(),
	timerEndsAt: z.number().nullable(),
	matchId: z.string().nullable(),
	scores: z.record(z.string(), z.number()),
	guessedPlayers: z.array(z.string()),
	lastTurn: z
		.object({ word: z.string(), points: z.record(z.string(), z.number()) })
		.nullable(),
	persistence: z.enum(["NONE", "SAVING", "SAVED", "FAILED"]),
});

export const LobbyUpdatedPacketSchema = z.object({
	type: z.literal("LOBBY_UPDATED"),
	lobby: LobbyResponseSchema,
});

export const LobbiesChangedPacketSchema = z.object({
	type: z.literal("LOBBIES_CHANGED"),
});

export const SendGameChatPacketSchema = z.object({
	type: z.literal("SEND_GAME_CHAT"),
	roomId: z.string().min(1).max(100),
	requestId: z.string().min(1).max(100),
	content: z.string().trim().min(1).max(500),
});
const gameChatEventFields = {
	roomId: z.string().min(1).max(100),
	requestId: z.string().min(1).max(100),
	id: z.string(),
	sender: z.string(),
};
export const GameChatMessagePacketSchema = z.object({
	type: z.literal("GAME_CHAT_MESSAGE"),
	...gameChatEventFields,
	content: z.string().min(1).max(500),
});
export const GameChatGuessPacketSchema = z.object({
	type: z.literal("GAME_CHAT_GUESS"),
	...gameChatEventFields,
});
export const GameChatErrorPacketSchema = z.object({
	type: z.literal("GAME_CHAT_ERROR"),
	roomId: z.string(),
	requestId: z.string(),
	text: z.string(),
});
export type SendGameChatPacket = z.infer<typeof SendGameChatPacketSchema>;
export type GameChatMessagePacket = z.infer<typeof GameChatMessagePacketSchema>;
export type GameChatGuessPacket = z.infer<typeof GameChatGuessPacketSchema>;
export type GameChatErrorPacket = z.infer<typeof GameChatErrorPacketSchema>;
export type GameChatEventPacket = GameChatMessagePacket | GameChatGuessPacket;

export const AppPacketSchema = z.discriminatedUnion(
	"type",
	[
		ErrorPacketSchema,
		MessagePacketSchema,
		SendMessagePacketSchema,
		ReceiveMessagePacketSchema,
		JoinGamePacketSchema,
		RetryGameSavePacketSchema,
		ChooseWordPacketSchema,
		DrawStrokePacketSchema,
		DrawActionPacketSchema,
		GameStatePacketSchema,
		LobbyUpdatedPacketSchema,
		LobbiesChangedPacketSchema,
		SendGameChatPacketSchema,
		GameChatMessagePacketSchema,
		GameChatGuessPacketSchema,
		GameChatErrorPacketSchema,
	],
	"Unknown type",
);

export type ErrorPacket = z.infer<typeof ErrorPacketSchema>;
export type MessagePacket = z.infer<typeof MessagePacketSchema>;
export type SendMessagePacket = z.infer<typeof SendMessagePacketSchema>;
export type ReceiveMessagePacket = z.infer<typeof ReceiveMessagePacketSchema>;
export type JoinGamePacket = z.infer<typeof JoinGamePacketSchema>;
export type ChooseWordPacket = z.infer<typeof ChooseWordPacketSchema>;
export type DrawStrokePacket = z.infer<typeof DrawStrokePacketSchema>;
export type DrawAction = z.infer<typeof DrawActionSchema>;
export type DrawActionPacket = z.infer<typeof DrawActionPacketSchema>;
export type GamePhase = GameStatePacket["phase"];
export type GameStatePacket = z.infer<typeof GameStatePacketSchema>;
export type LobbyUpdatedPacket = z.infer<typeof LobbyUpdatedPacketSchema>;
export type LobbiesChangedPacket = z.infer<typeof LobbiesChangedPacketSchema>;
export type AppPacket = z.infer<typeof AppPacketSchema>;

export type PacketAction = AppPacket["type"];

export interface AppWebSocket extends WebSocket {
	uuid?: string;
	isAlive: boolean;
}

export function createErrorPacket(text: string): ErrorPacket {
	return { type: "ERROR", text };
}

export function createMessagePacket(text: string): MessagePacket {
	return { type: "MESSAGE", text };
}

export function createSendMessagePacket(
	receiver: string,
	content: string,
): SendMessagePacket {
	return { type: "SEND_MESSAGE", receiver: receiver, content: content };
}

export function createReceiveMessagePacket(
	uuid: string,
	sender: string,
	receiver: string,
	content: string,
): ReceiveMessagePacket {
	return {
		type: "RECEIVE_MESSAGE",
		uuid: uuid,
		sender: sender,
		receiver: receiver,
		content: content,
	};
}
