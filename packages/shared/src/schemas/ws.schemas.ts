import { WebSocket } from "ws";
import z from "zod";

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

// Game chat uses separate packets and never persists message history.
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
