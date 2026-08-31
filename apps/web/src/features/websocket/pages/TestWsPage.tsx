import {
	createMessagePacket,
	type MessagePacket,
} from "@ft_transcendence/shared";
import { useWsEvent } from "../hooks/useWsEvent";
import { useWebSocket } from "../context/WebSocketContext";

export default function TestWsPage() {
	const { sendPacket } = useWebSocket();

	useWsEvent<MessagePacket>("MESSAGE", (packet) => {
		console.log("Log:", packet.text);
	});

	useWsEvent<MessagePacket>("MESSAGE", (packet) => {
		console.error("Error:", packet.text);
	});

	const testMessage = () => {
		sendPacket(createMessagePacket("Hello World"));
	};

	return (
		<div>
			<button onClick={testMessage} className="border">
				Test Message
			</button>
		</div>
	);
}
