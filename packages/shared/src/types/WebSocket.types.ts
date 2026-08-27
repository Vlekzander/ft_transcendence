import { WebSocket } from "ws";

export type PacketAction = "ERROR" | "MESSAGE";

export interface BasePacket {
	type: PacketAction;
}

//PACKETS FROM SERVER
export interface ErrorPacket extends BasePacket {
	type: "ERROR";
	text: string;
}

//PACKETS FROM CLIENT
export interface MessagePacket extends BasePacket {
	type: "MESSAGE";
	text: string;
}

export type AppPacket = ErrorPacket | MessagePacket;

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
