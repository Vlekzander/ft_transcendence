import {
	AppWebSocket,
	createReceiveMessagePacket,
	SendMessagePacket,
	UserParamsSchema,
} from "@ft_transcendence/shared";
import { chatService } from "./chat.service";
import { RequireAuthError, SelfMessageError } from "@/errors";
import { sendToWs } from "@/websocket.server";
import { ParsedRequest } from "@/middlewares/validate.middleware";
import { NextFunction, Response } from "express";
import { getTokenUuid } from "@/middlewares/auth.middleware";

type UserParamRequest = ParsedRequest<{ params: typeof UserParamsSchema }>;

// REQUESTS

export async function getChatHistory(
	req: UserParamRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const sender = getTokenUuid(req);
		const { uuid: receiver } = req.parsedParams!;

		if (!sender) throw new RequireAuthError();
		const result = await chatService.getConversation(sender, receiver);
		res.status(200).send({ chatHistory: result });
	} catch (err) {
		next(err);
	}
}

// WEBSOCKET

export async function handleMessage(
	ws: AppWebSocket,
	packet: SendMessagePacket,
) {
	if (!ws.uuid) throw new RequireAuthError();
	if (ws.uuid === packet.receiver) throw new SelfMessageError();
	const result = await chatService.sendMessage(
		ws.uuid,
		packet.receiver,
		packet.content,
	);
	const resPacket = createReceiveMessagePacket(
		result.uuid,
		result.senderId,
		result.content,
	);

	sendToWs(result.senderId, resPacket);
	sendToWs(result.receiverId, resPacket);
}
