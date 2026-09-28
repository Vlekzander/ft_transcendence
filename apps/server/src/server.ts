import app from "./app";
import dotenv from "dotenv";
import { setupWebSocketServer } from "./websocket.server";

dotenv.config();
const API_PORT = process.env.API_PORT || 3000;

const server = app.listen(API_PORT, () => {
	console.log(`Express server running on http://localhost:${API_PORT}`);
});

const wss = setupWebSocketServer(server);

function shutdown() {
	console.log("Shutdown server...");
	server.close(function () {
		console.log("Express server closed");
	});
	wss.close(function () {
		console.log("WebSocket server closed");
	});
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
