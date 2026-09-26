import { registerPacketHandler } from "@/websocket.server";
import * as ChatSocketController from "./chat.controller";

export function registerChatSockets(): void {
	registerPacketHandler("MESSAGE", ChatSocketController.handleMessage);
}
