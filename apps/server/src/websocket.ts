import { Server } from "http";
import { WebSocketServer } from "ws";

export const setupWebSocketServer = (httpserver: Server) => {
	const wss = new WebSocketServer({ server: httpserver });

	wss.on("connection", (ws) => {
		console.log("Client connected");
		ws.send("Welcome");

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
