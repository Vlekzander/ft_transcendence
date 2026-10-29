import {
	AppPacket,
	AppPacketSchema,
	AppWebSocket,
	createErrorPacket,
} from "@ft_transcendence/shared";
import { Server } from "http";
import { RawData, WebSocket, WebSocketServer } from "ws";
import { validateAccessToken } from "./utils/jwt.util";
import { registerAllSockets } from "./socket";
import { sharedService } from "./modules/shared/shared.service";

const HEARTBEAT_INTERVAL = 45000;

export type PacketHandler<T extends AppPacket = AppPacket> = (
	ws: AppWebSocket,
	packet: T,
) => void | Promise<void>;

const handlers = new Map<string, PacketHandler<never>>();

export function registerPacketHandler<T extends AppPacket["type"]>(
	type: T,
	handler: PacketHandler<Extract<AppPacket, { type: T }>>,
) {
	handlers.set(type, handler as PacketHandler<never>);
}

export function getPacketHandler(
	type: string,
): PacketHandler<AppPacket> | undefined {
	return handlers.get(type) as PacketHandler<AppPacket> | undefined;
}

const presence = new Map<string, Set<AppWebSocket>>();

export function isUserOnline(uuid: string): boolean {
	const sockets = presence.get(uuid);
	return sockets != null && sockets.size > 0;
}

export function getOnlineUsers(): string[] {
	return Array.from(presence.keys());
}

export function sendToWs(uuid: string, packet: AppPacket) {
	const sockets = presence.get(uuid);

	if (!sockets) return;
	for (const socket of sockets) socket.send(JSON.stringify(packet));
}

async function addSocketToPresence(ws: AppWebSocket, uuid: string) {
	const user = await sharedService.getUserById(uuid);
	const isActive = await sharedService.validateUser(uuid);

	if (!user || !isActive || ws.readyState !== WebSocket.OPEN) return;
	ws.uuid = uuid;

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

async function handlePacket(ws: AppWebSocket, data: RawData) {
	let rawJson: unknown;

	try {
		rawJson = JSON.parse(data.toString());
	} catch {
		sendError(ws, "Invalid JSON");
		return;
	}

	const result = AppPacketSchema.safeParse(rawJson);
	if (!result.success) {
		const errorMessages = result.error.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join(", ");
		sendError(ws, `Invalid packet: ${errorMessages}`);
		return;
	}

	const packet: AppPacket = result.data;

	const handler = getPacketHandler(packet.type);

	if (!handler) {
		sendError(ws, `Unknown packet type: ${packet.type}`);
		return;
	}

	try {
		if (ws.uuid && !(await sharedService.validateUser(ws.uuid))) {
			removeSocketFromPresence(ws);
			ws.uuid = undefined;
			sendError(ws, "Authentication required");
			return;
		}
		await handler(ws, packet);
	} catch (error) {
		if (error instanceof Error) sendError(ws, error.message);
	}
}

export const setupWebSocketServer = (httpserver: Server) => {
	registerAllSockets();

	const wss = new WebSocketServer({ server: httpserver });

	wss.on("connection", (ws: AppWebSocket, req) => {
		ws.isAlive = true;

		// Install listeners immediately, but wait for account validation before
		// dispatching messages. A JWT alone does not prove the account is active.
		const authentication = (async () => {
			try {
				const token = req.headers.cookie
					?.split(";")
					.map((c) => c.trim())
					.find((c) => c.startsWith("token="))
					?.slice("token=".length);
				if (token) {
					const payload = validateAccessToken(token);
					if (payload.sub)
						await addSocketToPresence(ws, payload.sub.toString());
				}
			} catch (error) {
				if (error instanceof Error) sendError(ws, error.message);
			}
		})();

		const heartbeatInterval = startHeartbeat(ws);

		ws.on("close", () => {
			clearInterval(heartbeatInterval);
			removeSocketFromPresence(ws);
		});

		ws.on("message", (message: RawData) => {
			void authentication.then(() => {
				if (ws.readyState === WebSocket.OPEN)
					return handlePacket(ws, message);
			});
		});

		ws.on("pong", () => {
			handlePong(ws);
		});
	});

	return wss;
};
