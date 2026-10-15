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

export const AppPacketSchema = z.discriminatedUnion("type", [
	ErrorPacketSchema,
	MessagePacketSchema,
	SendMessagePacketSchema,
	ReceiveMessagePacketSchema,
]);

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
