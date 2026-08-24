import { WebSocket } from "ws";

export type PacketAction = "ERROR";

export interface BasePacket {
	action: PacketAction;
}

export interface ErrorPacket extends BasePacket {
	action: "ERROR";
	text: string;
}

export type AppPackets = ErrorPacket;

export interface AppWebSocket extends WebSocket {
	uuid?: string;
}

export function createErrorPacket(text: string): ErrorPacket {
	return { action: "ERROR", text };
}
