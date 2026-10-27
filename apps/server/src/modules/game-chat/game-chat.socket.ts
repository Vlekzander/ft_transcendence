import { lobbiesByJoinCode } from "../lobby/lobby.service";
import { completeRoundIfSolved } from "../lobby/game.socket";
import type {
	AppWebSocket,
	SendGameChatPacket,
} from "@ft_transcendence/shared";
import { WebSocket } from "ws";
import { registerPacketHandler, sendToWs } from "@/websocket.server";
import { gameChatService } from "./game-chat.service";

export function handleGameChat(
	ws: AppWebSocket,
	packet: SendGameChatPacket,
): void {
	try {
		if (!ws.uuid) throw new Error("Authentication required");
		if (
			typeof packet.roomId !== "string" ||
			!packet.roomId ||
			packet.roomId.length > 100
		)
			throw new Error("Invalid game room");
		if (
			typeof packet.requestId !== "string" ||
			!packet.requestId ||
			packet.requestId.length > 100
		)
			throw new Error("Invalid request id");
		const event = gameChatService.submit(
			packet.roomId,
			ws.uuid,
			packet.content,
			packet.requestId,
		);
		for (const playerId of gameChatService.getPlayers(packet.roomId))
			sendToWs(playerId, event);
		if (event.type === "GAME_CHAT_GUESS") {
			const lobby = [...lobbiesByJoinCode.values()].find(
				(room) => room.uuid === packet.roomId,
			);
			if (lobby) completeRoundIfSolved(lobby);
		}
	} catch (error) {
		if (ws.readyState === WebSocket.OPEN)
			ws.send(
				JSON.stringify({
					type: "GAME_CHAT_ERROR",
					roomId:
						typeof packet.roomId === "string"
							? packet.roomId.slice(0, 100)
							: "",
					requestId:
						typeof packet.requestId === "string"
							? packet.requestId.slice(0, 100)
							: "",
					text:
						error instanceof Error
							? error.message
							: "Unable to send message",
				}),
			);
	}
}

export function registerGameChatSockets(): void {
	registerPacketHandler("SEND_GAME_CHAT", handleGameChat);
}
