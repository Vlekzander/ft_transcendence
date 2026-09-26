import {
	AppWebSocket,
	createMessagePacket,
	MessagePacket,
} from "@ft_transcendence/shared";

export async function handleMessage(ws: AppWebSocket, packet: MessagePacket) {
	ws.send(
		JSON.stringify(createMessagePacket(`Your message: ${packet.text}`)),
	);
}
