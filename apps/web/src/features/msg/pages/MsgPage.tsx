import {
	createSendMessagePacket,
	toMessageDTO,
	type MessageDTO,
	type PublicUserDTO,
	type ReceiveMessagePacket,
} from "@ft_transcendence/shared";
import { useNavigate, useParams } from "react-router";
import { useWsEvent } from "../../websocket/hooks/useWsEvent";
import { useAuth } from "../../auth/context/AuthContext";
import { useEffect, useState } from "react";
import { useWebSocket } from "../../websocket/context/WebSocketContext";
import { getUser } from "../../user/services/user.service";
import { getMessages } from "../services/messages.service";

export default function MsgPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { sendPacket } = useWebSocket();
	const { uuid } = useParams<{ uuid: string }>();

	const [isLoading, setLoading] = useState(false);
	const [messages, setMessages] = useState<MessageDTO[]>([]);
	const [content, setContent] = useState("");
	const [otherUser, setOtherUser] = useState<PublicUserDTO | undefined>();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		const fetchData = async () => {
			if (!uuid) return;
			try {
				setLoading(true);
				setError(null);

				const resUser = await getUser(uuid);
				if (resUser.ok === false) {
					navigate("/not-found", { replace: true });
					return;
				}
				const resMessages = await getMessages(uuid);

				const resultUser = resUser.data;
				const resultMessages = resMessages.ok ? resMessages.data : [];

				if (isMounted) {
					setOtherUser(resultUser);
					setMessages(resultMessages);
				}
			} catch (error) {
				if (isMounted) setError(error.message || "An error occured");
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchData();
		return () => {
			isMounted = false;
		};
	}, [uuid]);

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
					{msg.sender === user.uuid
						? user.username
						: otherUser.username}{" "}
					- {msg.content}
				</div>
			))}
			{error && <p className="text-red-500">{error}</p>}
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
