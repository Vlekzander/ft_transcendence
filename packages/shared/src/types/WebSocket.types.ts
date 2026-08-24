import { WebSocket } from "ws";

export type PacketAction = "ERROR";

export interface BasePacket {
	type: PacketAction;
}

export interface ErrorPacket extends BasePacket {
	type: "ERROR";
	text: string;
}

export type AppPacket = ErrorPacket;

export interface AppWebSocket extends WebSocket {
	uuid?: string;
}

export function createErrorPacket(text: string): ErrorPacket {
	return { type: "ERROR", text };
}
