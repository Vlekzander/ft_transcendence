import { AppWebSocket, createErrorPacket } from "@ft_transcendence/shared";
import { Server } from "http";
import { WebSocketServer } from "ws";
import { validateAccessToken } from "./utils/jwt.util";

export const setupWebSocketServer = (httpserver: Server) => {
	const wss = new WebSocketServer({ server: httpserver });

	wss.on("connection", (ws: AppWebSocket, req) => {
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

		if (ws.uuid) ws.send(`Your uuid: ${ws.uuid}`);
		ws.on("message", (message) => {
			console.log(`Received: ${message}`);
			ws.send(`Echo: ${message}`);
		});

		ws.on("close", () => {
			ws.send("Websocket disconnected");
		});
	});

	return wss;
};

function sendError(ws: AppWebSocket, text: string) {
	if (ws.readyState !== WebSocket.OPEN) return;
	ws.send(JSON.stringify(createErrorPacket(text)));
}
