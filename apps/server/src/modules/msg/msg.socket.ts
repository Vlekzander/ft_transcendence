import { registerPacketHandler } from "@/websocket.server";
import * as MsgSocketController from "./msg.controller";

export function registerMsgSockets(): void {
	registerPacketHandler("SEND_MESSAGE", MsgSocketController.handleMessage);
}
