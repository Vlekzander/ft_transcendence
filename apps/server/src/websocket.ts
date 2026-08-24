import {
	AppPacket,
	AppWebSocket,
	createErrorPacket,
} from "@ft_transcendence/shared";
import { Server } from "http";
import { RawData, WebSocketServer } from "ws";
import { validateAccessToken } from "./utils/jwt.util";

const HEARTBEAT_INTERVAL = 45000;

export const setupWebSocketServer = (httpserver: Server) => {
	const wss = new WebSocketServer({ server: httpserver });

	wss.on("connection", (ws: AppWebSocket, req) => {
		ws.isAlive = true;
		console.log("Client connected");
		ws.send("Websocket connected");

		try {
			const cookies = req.headers.cookie?.split(";");
			const token = cookies
				?.filter((element) => element.startsWith("token="))[0]
				.replace("token=", "");
			if (token) {
				const payload = validateAccessToken(token);
				ws.uuid = payload.sub?.toString();
			}
		} catch (error) {
			console.error(error);
			if (error instanceof Error) sendError(ws, error.message);
		}

		setInterval(() => {
			if (ws.isAlive === false) {
				console.log("Terminating dead connection");
				ws.send("Terminating connection...");
				return ws.terminate();
			}
			ws.isAlive = false;
			ws.ping();
		}, HEARTBEAT_INTERVAL);

		if (ws.uuid) ws.send(`Your uuid: ${ws.uuid}`);
		ws.on("message", (message: RawData) => {
			console.log(`Received: ${message}`);
			handleMessage(ws, message);
		});

		ws.on("pong", () => {
			ws.isAlive = true;
		});

		ws.on("close", () => {
			ws.send("Websocket disconnected");
		});
	});

	return wss;
};

function handleMessage(ws: AppWebSocket, data: RawData) {
	let packet: AppPacket;

	try {
		packet = JSON.parse(data.toString());
	} catch (error) {
		console.error(error);
		if (error instanceof Error) sendError(ws, error.message);
		return;
	}

	switch (packet.type) {
		default:
			sendError(ws, `Unknown packet type: ${packet.type}`);
	}
}

function sendError(ws: AppWebSocket, text: string) {
	if (ws.readyState !== WebSocket.OPEN) return;
	ws.send(JSON.stringify(createErrorPacket(text)));
}
