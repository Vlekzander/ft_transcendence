import { WebSocket } from "ws";

export type PacketAction =
	| "ERROR"
	| "MESSAGE"
	| "SEND_MESSAGE"
	| "RECEIVE_MESSAGE";

export interface BasePacket {
	type: PacketAction;
}

export interface ErrorPacket extends BasePacket {
	type: "ERROR";
	text: string;
}

export interface MessagePacket extends BasePacket {
	type: "MESSAGE";
	text: string;
}

export interface SendMessagePacket extends BasePacket {
	type: "SEND_MESSAGE";
	receiver: string;
	content: string;
}

export interface ReceiveMessagePacket extends BasePacket {
	type: "RECEIVE_MESSAGE";
	uuid: string;
	sender: string;
	content: string;
}

export type AppPacket =
	| ErrorPacket
	| MessagePacket
	| SendMessagePacket
	| ReceiveMessagePacket;

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
	content: string,
): ReceiveMessagePacket {
	return {
		type: "RECEIVE_MESSAGE",
		uuid: uuid,
		sender: sender,
		content: content,
	};
}
