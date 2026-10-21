import { WebSocket } from "ws";

export type PacketAction =
	| "ERROR"
	| "MESSAGE"
	| "SEND_MESSAGE"
	| "RECEIVE_MESSAGE"
	| "JOIN_GAME"
	| "CHOOSE_WORD"
	| "DRAW_STROKE"
	| "DRAW_ACTION"
	| "GAME_STATE";

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
	receiver: string;
	content: string;
}

export type GamePhase = "WAITING" | "CHOOSING" | "DRAWING" | "PAUSED";

export interface JoinGamePacket extends BasePacket {
	type: "JOIN_GAME";
	lobbyUuid: string;
}

export interface ChooseWordPacket extends BasePacket {
	type: "CHOOSE_WORD";
	lobbyUuid: string;
	word: string;
}

export interface DrawStrokePacket extends BasePacket {
	type: "DRAW_STROKE";
	lobbyUuid: string;
	from: { x: number; y: number };
	to: { x: number; y: number };
	color: string;
	size: number;
	eraser: boolean;
}

export type DrawAction =
	| {
			kind: "SHAPE";
			mode: "rectangle" | "circle";
			from: { x: number; y: number };
			to: { x: number; y: number };
			color: string;
			size: number;
			eraser: boolean;
	  }
	| { kind: "FILL"; x: number; y: number; color: string }
	| { kind: "CLEAR" };

export interface DrawActionPacket extends BasePacket {
	type: "DRAW_ACTION";
	lobbyUuid: string;
	action: DrawAction;
}

export interface GameStatePacket extends BasePacket {
	type: "GAME_STATE";
	lobbyUuid: string;
	phase: GamePhase;
	round: number;
	totalRounds: number;
	playerNumber: number;
	totalPlayers: number;
	drawerId: string | null;
	choices: string[];
	selectedWord: string | null;
	timerEndsAt: number | null;
}

export type AppPacket =
	| ErrorPacket
	| MessagePacket
	| SendMessagePacket
	| ReceiveMessagePacket
	| JoinGamePacket
	| ChooseWordPacket
	| DrawStrokePacket
	| DrawActionPacket
	| GameStatePacket;

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
