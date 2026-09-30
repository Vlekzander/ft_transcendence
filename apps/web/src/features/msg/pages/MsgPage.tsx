import {
	createSendMessagePacket,
	toMessageDTO,
	type MessageDTO,
	type PublicUserDTO,
	type ReceiveMessagePacket,
} from "@ft_transcendence/shared";
import { Link, useNavigate, useParams } from "react-router";
import { useWsEvent } from "../../websocket/hooks/useWsEvent";
import { useAuth } from "../../auth/context/AuthContext";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useWebSocket } from "../../websocket/context/WebSocketContext";
import { getUser } from "../../user/services/user.service";
import { getMessages } from "../services/messages.service";
import ErrorComponent from "../../../shared/components/ErrorComponent";
import { MessageSquare, Send } from "lucide-react";
import { FriendActionButton } from "../../friends/components/FriendActionButton";
import { AVATARS_PATH, getErrorMessage } from "../../../config";
import UserStatusComponent from "../../user/components/UserStatus";

export default function MsgPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { sendPacket } = useWebSocket();
	const { uuid } = useParams<{ uuid: string }>();

	const [messages, setMessages] = useState<MessageDTO[]>([]);
	const [otherUser, setOtherUser] = useState<PublicUserDTO | undefined>();
	const [content, setContent] = useState("");
	const [isLoading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const isFirstLoad = useRef(true);

	useEffect(() => {
		let isMounted = true;

		const fetchData = async () => {
			if (!uuid) return;
			try {
				setLoading(true);
				setError(null);

				const [userResponse, messagesResponse] = await Promise.all([
					getUser(uuid),
					getMessages(uuid),
				]);

				if (userResponse.ok === false) {
					navigate("/not-found");
					return;
				}

				if (isMounted) {
					setOtherUser(userResponse.data);
					setMessages(
						messagesResponse.ok ? messagesResponse.data : [],
					);
				}
			} catch (error) {
				const message = getErrorMessage(error);
				if (isMounted)
					setError(message || "Unable to load conversation");
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchData();
		return () => {
			isMounted = false;
		};
	}, [navigate, uuid]);

	const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
		messagesEndRef.current?.scrollIntoView({ behavior });
	};

	useEffect(() => {
		if (isLoading) return;

		if (isFirstLoad.current) {
			scrollToBottom("auto");
			isFirstLoad.current = false;
		} else {
			scrollToBottom("smooth");
		}
	}, [messages, isLoading]);

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

	function handleSubmit(e: ChangeEvent<HTMLFormElement>) {
		e.preventDefault();
		const trimmedContent = content.trim();
		if (!uuid || !trimmedContent) return;

		sendPacket(createSendMessagePacket(uuid, trimmedContent));
		setContent("");
	}

	if (isLoading) {
		return (
			<div className="p-10 flex justify-center items-center">
				<p className="text-2xl">Loading...</p>
			</div>
		);
	}

	if (error) {
		return (
			<ErrorComponent
				message={error}
				button_text="Retry"
				onClick={() => window.location.reload()}
			/>
		);
	}

	return (
		<div className="p-4 sm:p-5 flex flex-col gap-4 max-w-5xl mx-auto w-full h-[calc(100dvh-5rem)] overflow-hidden">
			<div className="flex items-center justify-between border-b border-gray-300 pb-4">
				<div className="flex items-center gap-3">
					<h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
						<MessageSquare className="text-primary" size={28} />
						Messages
					</h1>
				</div>
			</div>

			{otherUser && (
				<div className="flex items-center justify-between p-3 border border-gray-300 bg-background">
					<Link
						to={`/user/${otherUser.uuid}`}
						className="flex items-center gap-3 hover:opacity-80 transition-opacity"
					>
						<img
							src={
								otherUser.avatarPath === null
									? "/assets/default_avatar.jpg"
									: AVATARS_PATH + otherUser.avatarPath
							}
							alt={otherUser.username}
							width={40}
							height={40}
							className="w-10 h-10 object-cover border"
						/>
						<div className="flex flex-col">
							<span className="font-semibold text-base sm:text-lg">
								{otherUser.username}
							</span>
							<UserStatusComponent
								status={otherUser.online ? "online" : "offline"}
							/>
						</div>
					</Link>
					{otherUser && uuid && (
						<div className="flex items-center gap-2">
							<FriendActionButton uuid={uuid} />
						</div>
					)}
				</div>
			)}

			<div className="flex flex-col border border-gray-300 bg-background flex-1 min-h-0 overflow-hidden">
				<div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 min-h-0">
					{messages.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-center p-6">
							<p className="text-gray-500">No messages yet.</p>
							<p className="text-sm text-gray-400 mt-1">
								Send a message to start the conversation!
							</p>
						</div>
					) : (
						messages.map((msg) => {
							const isMe = msg.sender === user?.uuid;
							return (
								<div
									key={msg.uuid}
									className={`flex flex-col max-w-[80%] ${
										isMe
											? "self-end items-end"
											: "self-start items-start"
									}`}
								>
									<span className="text-xs text-gray-500 mb-1 px-1">
										{isMe
											? user?.username
											: otherUser?.username}
									</span>
									<div
										className={`p-3 text-sm sm:text-base border wrap-break-words ${
											isMe
												? "bg-primary text-white border-primary"
												: "bg-gray-100 border-gray-300 text-foreground"
										}`}
									>
										{msg.content}
									</div>
								</div>
							);
						})
					)}
					<div ref={messagesEndRef} />
				</div>

				<form
					onSubmit={handleSubmit}
					className="border-t border-gray-300 p-3 bg-gray-50 flex gap-2"
				>
					<input
						type="text"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="Type a message..."
						className="flex-1 px-4 py-2 border border-gray-400 bg-background text-sm sm:text-base focus:outline-none focus:border-primary"
						autoFocus
					/>
					<button
						type="submit"
						disabled={!content.trim()}
						className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-primary text-white hover:bg-primary/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Send size={18} />
						<span className="hidden sm:inline">Send</span>
					</button>
				</form>
			</div>
		</div>
	);
}
