import { WebSocket } from "ws";

export type PacketAction = "MESSAGE";

export interface BasePacket {
	action: PacketAction;
}

export interface MessagePacket extends BasePacket {
	action: "MESSAGE";
	text: string;
}

export type AppPackets = MessagePacket;

export interface AppWebSocket extends WebSocket {
	uuid?: string;
}
