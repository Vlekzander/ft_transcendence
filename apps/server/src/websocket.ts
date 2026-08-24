import { AppWebSocket } from "@ft_transcendence/shared";
import { Server } from "http";
import { WebSocketServer } from "ws";
import { validateAccessToken } from "./utils/jwt.util";

export const setupWebSocketServer = (httpserver: Server) => {
	const wss = new WebSocketServer({ server: httpserver });

	wss.on("connection", (ws: AppWebSocket, req) => {
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
		}

		console.log("Client connected");
		ws.send("Welcome");
		if (ws.uuid) ws.send(`UUID: ${ws.uuid}`);

		ws.on("message", (message) => {
			console.log(`Received: ${message}`);
			ws.send(`Echo: ${message}`);
		});

		ws.on("close", () => {
			console.log("Client disconnected");
		});
	});

	return wss;
};
