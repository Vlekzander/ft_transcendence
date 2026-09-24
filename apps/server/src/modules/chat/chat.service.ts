import {
	InvalidIdError,
	UnknownElementError,
	UnknownUserIdError,
} from "@/errors";
import { Prisma } from "@/generated/prisma/client";
import { getPrismaConstraintFields } from "../shared/shared.service";
import { prisma } from "@/lib/prisma.lib";

export class ChatService {
	async sendMessage(sender: string, receiver: string, message: string) {
		try {
			const result = await prisma.message.create({
				data: {
					senderId: sender,
					receiverId: receiver,
					content: message,
				},
			});

			return result;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") {
					const fields = getPrismaConstraintFields(error);
					if (fields.includes("senderId"))
						throw new UnknownUserIdError();
					if (fields.includes("receiverId"))
						throw new UnknownUserIdError();
					if (fields.length) throw new UnknownElementError(fields[0]);
					throw new UnknownElementError("unknown");
				}
			}
			throw error;
		}
	}

	async getConversation(userA: string, userB: string) {
		try {
			const result = await prisma.message.findMany({
				where: {
					OR: [
						{
							senderId: userA,
							receiverId: userB,
						},
						{
							senderId: userB,
							receiverId: userA,
						},
					],
				},
				orderBy: { uuid: "asc" },
			});

			return result;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") {
					const fields = getPrismaConstraintFields(error);
					if (fields.includes("senderId"))
						throw new UnknownUserIdError();
					if (fields.includes("receiverId"))
						throw new UnknownUserIdError();
					if (fields.length) throw new UnknownElementError(fields[0]);
					throw new UnknownElementError("unknown");
				}
			}
			throw error;
		}
	}
}

export const chatService = new ChatService();
