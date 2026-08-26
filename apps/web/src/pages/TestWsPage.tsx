import { createMessagePacket } from "@ft_transcendence/shared";
import { useWebSocket } from "../contexts/WebSocketContext";

export default function TestWsPage() {
	const { sendPacket } = useWebSocket();

	const test = () => {
		sendPacket(createMessagePacket("Hello World"));
	};

	return (
		<div>
			<button onClick={test}>Test</button>
		</div>
	);
}
