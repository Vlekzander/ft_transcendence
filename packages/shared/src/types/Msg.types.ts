export type MessageDTO = {
	uuid: string;
	sender: string;
	receiver: string;
	content: string;
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
