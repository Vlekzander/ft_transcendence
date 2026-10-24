import { PublicUserDTO } from "../schemas/user.schemas";

export type MessageDTO = {
	uuid: string;
	sender: string;
	receiver: string;
	content: string;
};

export type ConversationPreviewDTO = {
	sender: PublicUserDTO;
	receiver: PublicUserDTO;
	message: MessageDTO;
};

export function toMessageDTO(
	uuid: string,
	sender: string,
	receiver: string,
	content: string,
): MessageDTO {
	return {
		uuid: uuid,
		sender: sender,
		receiver: receiver,
		content: content,
	};
}
