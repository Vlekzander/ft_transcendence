import {
	AppWebSocket,
	ConversationPreviewDTO,
	createReceiveMessagePacket,
	SendMessagePacket,
	toMessageDTO,
	UserParamsSchema,
} from "@ft_transcendence/shared";
import { msgService } from "./msg.service";
import { RequireAuthError, SelfMessageError } from "@/errors";
import { sendToWs } from "@/websocket.server";
import { ParsedRequest } from "@/middlewares/validate.middleware";
import { NextFunction, Request, Response } from "express";
import { getTokenUuid } from "@/middlewares/auth.middleware";
import { toPublicUserDTO } from "../shared/shared.mapper";

type UserParamRequest = ParsedRequest<{ params: typeof UserParamsSchema }>;

// REQUESTS

export async function getMsgHistory(
	req: UserParamRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const sender = getTokenUuid(req);
		const { uuid: receiver } = req.parsedParams!;

		if (!sender) throw new RequireAuthError();
		const result = await msgService.getConversation(sender, receiver);
		const messages = result.map((e) =>
			toMessageDTO(e.uuid, e.senderId, e.receiverId, e.content),
		);
		res.status(200).send({ messages: messages });
	} catch (err) {
		next(err);
	}
}

export async function getMsgPreview(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const sender = getTokenUuid(req);

		if (!sender) throw new RequireAuthError();
		const result = await msgService.getPreview(sender);
		const conversationsPreview = result.map((e) => {
			const preview: ConversationPreviewDTO = {
				message: toMessageDTO(
					e.uuid,
					e.senderId,
					e.receiverId,
					e.content,
				),
				sender: toPublicUserDTO(e.sender),
				receiver: toPublicUserDTO(e.receiver),
			};
			return preview;
		});
		res.status(200).send({ preview: conversationsPreview });
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
	const result = await msgService.sendMessage(
		ws.uuid,
		packet.receiver,
		packet.content,
	);
	const resPacket = createReceiveMessagePacket(
		result.uuid,
		result.senderId,
		result.receiverId,
		result.content,
	);

	sendToWs(result.senderId, resPacket);
	sendToWs(result.receiverId, resPacket);
}
