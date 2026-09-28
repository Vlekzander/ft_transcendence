import {
	AppPacket,
	AppWebSocket,
	createErrorPacket,
	createMessagePacket,
} from "@ft_transcendence/shared";
import { Server } from "http";
import { RawData, WebSocket, WebSocketServer } from "ws";
import { validateAccessToken } from "./utils/jwt.util";

const HEARTBEAT_INTERVAL = 45000;

const presence = new Map<string, Set<AppWebSocket>>();

export function isUserOnline(uuid: string): boolean {
	const sockets = presence.get(uuid);
	return sockets != null && sockets.size > 0;
}

export function getOnlineUsers(): string[] {
	return Array.from(presence.keys());
}

function addSocketToPresence(ws: AppWebSocket) {
	if (!ws.uuid) return;

	const sockets = presence.get(ws.uuid) ?? new Set<AppWebSocket>();

	sockets.add(ws);
	presence.set(ws.uuid, sockets);
}

function removeSocketFromPresence(ws: AppWebSocket) {
	if (!ws.uuid) return;

	const sockets = presence.get(ws.uuid);

	if (!sockets) return;

	sockets.delete(ws);

	if (sockets.size === 0) presence.delete(ws.uuid);
}

function startHeartbeat(ws: AppWebSocket) {
	return setInterval(() => {
		if (ws.isAlive === false) {
			ws.terminate();
			return;
		}
		ws.isAlive = false;
		ws.ping();
	}, HEARTBEAT_INTERVAL);
}

function handlePong(ws: AppWebSocket) {
	ws.isAlive = true;
}

function sendError(ws: AppWebSocket, text: string) {
	if (ws.readyState !== WebSocket.OPEN) return;
	ws.send(JSON.stringify(createErrorPacket(text)));
}

function handleMessage(ws: AppWebSocket, data: RawData) {
	let packet: AppPacket;

	try {
		packet = JSON.parse(data.toString());
	} catch (error) {
		if (error instanceof Error) sendError(ws, error.message);
		return;
	}

	switch (packet.type) {
		case "MESSAGE":
			ws.send(
				JSON.stringify(
					createMessagePacket(`Your message: ${packet.text}`),
				),
			);
			break;
		default:
			sendError(ws, `Unknown packet type: ${packet.type}`);
	}
}

export const setupWebSocketServer = (httpserver: Server) => {
	const wss = new WebSocketServer({ server: httpserver });

	wss.on("connection", (ws: AppWebSocket, req) => {
		ws.isAlive = true;

		try {
			const token = req.headers.cookie
				?.split(";")
				.map((cookie) => cookie.trim())
				.find((cookie) => cookie.startsWith("token="))
				?.replace("token=", "");

			if (token) {
				const payload = validateAccessToken(token);

				ws.uuid = payload.sub?.toString();
			}
		} catch (error) {
			if (error instanceof Error) sendError(ws, error.message);
		}

		addSocketToPresence(ws);

		const heartbeatInterval = startHeartbeat(ws);

		ws.on("close", () => {
			clearInterval(heartbeatInterval);
			removeSocketFromPresence(ws);
		});

		ws.on("message", (message: RawData) => {
			handleMessage(ws, message);
		});

		ws.on("pong", () => {
			handlePong(ws);
		});
	});

	return wss;
};
