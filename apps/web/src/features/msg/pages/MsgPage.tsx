import {
	createSendMessagePacket,
	toMessageDTO,
	type MessageDTO,
	type ReceiveMessagePacket,
} from "@ft_transcendence/shared";
import { useParams } from "react-router";
import { useWsEvent } from "../../websocket/hooks/useWsEvent";
import { useAuth } from "../../auth/context/AuthContext";
import { useEffect, useState } from "react";
import { API_URL } from "../../../config";
import { useWebSocket } from "../../websocket/context/WebSocketContext";

export default function MsgPage() {
	const { user } = useAuth();
	const { sendPacket } = useWebSocket();
	const { uuid } = useParams<{ uuid: string }>(); //TODO: GET USER DATA

	const [isLoading, setLoading] = useState(false);
	const [messages, setMessages] = useState<MessageDTO[]>([]);
	const [content, setContent] = useState("");

	useWsEvent<ReceiveMessagePacket>("RECEIVE_MESSAGE", (packet) => {
		if (packet.sender !== uuid && packet.receiver !== uuid) return;
		const message = toMessageDTO(
			packet.uuid,
			packet.sender,
			packet.receiver,
			packet.content,
		);
		setMessages((prevMessages) => [...prevMessages, message]);
	});

	useEffect(() => {
		let isMounted = true;

		const fetchMsgs = async () => {
			if (!uuid) return;
			try {
				setLoading(true);

				const response = await fetch(`${API_URL}/msg/${uuid}`, {
					credentials: "include",
				});

				if (!response.ok) {
					//TODO: SHOW ERROR ?
				}

				const data = await response.json();

				if (isMounted) {
					setMessages(data.msgHistory || []);
				}
			} catch (error) {
				console.error(error);
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		fetchMsgs();

		return () => {
			isMounted = false;
		};
	}, [uuid]);

	const send = () => {
		if (content.trim().length === 0) return;
		const packet = createSendMessagePacket(uuid, content);
		setContent("");
		sendPacket(packet);
	};

	if (isLoading) {
		return (
			<div className="p-10 flex justify-center items-center">
				<p className="text-2xl">Loading...</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			{messages.map((msg) => (
				<div
					key={msg.uuid}
					className={
						msg.sender === user.uuid ? "bg-primary" : "bg-gray-300"
					}
				>
					{msg.content}
				</div>
			))}
			<input
				value={content}
				onChange={(e) => setContent(e.target.value)}
				className="border mt-5"
			/>
			<button onClick={send} className="border">
				Send
			</button>
		</div>
	);
}
