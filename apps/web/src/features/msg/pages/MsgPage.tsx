import {
	ConversationPreviewDTO,
	createSendMessagePacket,
	toMessageDTO,
	type MessageDTO,
	type PublicUserDTO,
	type ReceiveMessagePacket,
} from "@ft_transcendence/shared";
import {
	Link,
	Navigate,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router";
import { useWsEvent } from "../../websocket/hooks/useWsEvent";
import { useAuth } from "../../auth/context/AuthContext";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useWebSocket } from "../../websocket/context/WebSocketContext";
import { getUser } from "../../user/services/user.service";
import {
	getMessages,
	getConversationsPreview,
} from "../services/messages.service";
import ErrorComponent from "../../../shared/components/ErrorComponent";
import { MessageSquare, Send } from "lucide-react";
import { FriendActionButton } from "../../friends/components/FriendActionButton";
import { getAvatarUrl, getErrorMessage } from "../../../config";
import UserStatusComponent from "../../user/components/UserStatus";
import { useFriends } from "../../friends/context/FriendContext";

export function MsgRedirect() {
	const { uuid } = useParams<{ uuid: string }>();
	return <Navigate to={`/msg?user=${uuid}`} replace />;
}

export default function MsgPage() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const activeUuid = searchParams.get("user");

	const { user } = useAuth();
	const { refresh } = useFriends();
	const { sendPacket } = useWebSocket();

	const [conversations, setConversations] = useState<
		ConversationPreviewDTO[]
	>([]);
	const [messages, setMessages] = useState<MessageDTO[]>([]);
	const [otherUser, setOtherUser] = useState<PublicUserDTO | undefined>();
	const [content, setContent] = useState("");
	const [isLoading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const isFirstLoad = useRef(true);

	refresh();

	useEffect(() => {
		let isMounted = true;
		const fetchPreviews = async () => {
			const res = await getConversationsPreview();
			if (res.ok && isMounted) {
				setConversations(res.data);
			}
		};
		fetchPreviews();
		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (!activeUuid) {
			return;
		}

		if (user && user.uuid === activeUuid) {
			navigate("/msg", { replace: true });
			return;
		}

		let isMounted = true;

		const fetchActiveConversation = async () => {
			try {
				setLoading(true);
				setError(null);

				const [userResponse, messagesResponse] = await Promise.all([
					getUser(activeUuid),
					getMessages(activeUuid),
				]);

				if (userResponse.ok === false) {
					navigate("/msg", { replace: true });
					return;
				}

				if (isMounted) {
					setOtherUser(userResponse.data);
					setMessages(
						messagesResponse.ok ? messagesResponse.data : [],
					);
					isFirstLoad.current = true;
				}
			} catch (err) {
				const message = getErrorMessage(err);
				if (isMounted)
					setError(message || "Unable to load the conversation");
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchActiveConversation();
		return () => {
			isMounted = false;
		};
	}, [activeUuid, user, navigate]);

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
		const message = toMessageDTO(
			packet.uuid,
			packet.sender,
			packet.receiver,
			packet.content,
		);

		if (packet.sender === activeUuid || packet.receiver === activeUuid) {
			setMessages((prev) => [...prev, message]);
		}

		getConversationsPreview().then((res) => {
			if (res.ok) setConversations(res.data);
		});
	});

	function handleSubmit(e: ChangeEvent<HTMLFormElement>) {
		e.preventDefault();
		const trimmedContent = content.trim();
		if (!activeUuid || !trimmedContent) return;

		sendPacket(createSendMessagePacket(activeUuid, trimmedContent));
		setContent("");
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
		<div className="p-4 sm:p-5 short:p-2 flex flex-col gap-4 short:gap-2 max-w-6xl mx-auto w-full h-[calc(100dvh-5rem)] overflow-hidden">
			<div className="flex items-center justify-between border-b border-gray-300 pb-4 short:sr-only">
				<h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
					<MessageSquare className="text-primary" size={28} />
					Messages
				</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 short:grid-cols-1 short:grid-rows-[auto_minmax(0,1fr)] gap-4 short:gap-2 flex-1 min-h-0">
				<div className="border border-gray-300 bg-background flex flex-col overflow-y-auto short:overflow-x-auto short:overflow-y-hidden">
					<div className="p-3 border-b border-gray-200 font-semibold bg-gray-50 max-sm:hidden short:hidden">
						Conversations
					</div>
					<div className="divide-y divide-gray-200 flex-1 short:flex short:divide-y-0 short:divide-x">
						{conversations.length === 0 ? (
							<p className="p-4 text-sm text-gray-500 text-center">
								No conversation
							</p>
						) : (
							conversations.map((conv) => {
								const isSender =
									conv.message.sender === user?.uuid;
								const contact = isSender
									? conv.receiver
									: conv.sender;
								const isSelected = contact.uuid === activeUuid;

								return (
									<button
										key={contact.uuid}
										onClick={() =>
											setSearchParams({
												user: contact.uuid,
											})
										}
										className={`w-full short:w-auto short:max-w-48 short:shrink-0 p-3 short:p-2 flex items-center gap-3 text-left transition-colors hover:bg-gray-100 ${
											isSelected
												? "bg-gray-100 border-l-4 border-primary"
												: ""
										}`}
									>
										<img
											src={getAvatarUrl(
												contact.avatarPath,
											)}
											alt={contact.username}
											className="w-10 h-10 object-cover border"
										/>
										<div className="flex-1 short:flex-none min-w-0">
											<div className="flex justify-between items-center">
												<span className="font-semibold text-sm truncate">
													{contact.username}
												</span>
											</div>
											<p className="text-xs text-gray-500 truncate short:hidden">
												{isSender ? "You: " : ""}
												{conv.message.content}
											</p>
										</div>
									</button>
								);
							})
						)}
					</div>
				</div>

				<div className="md:col-span-2 short:col-span-1 flex flex-col border border-gray-300 bg-background min-h-0 overflow-hidden">
					{activeUuid && otherUser ? (
						<>
							<div className="flex items-center justify-between p-3 border-b border-gray-300 bg-background">
								<Link
									to={`/user/${otherUser.uuid}`}
									className="flex items-center gap-3 hover:opacity-80 transition-opacity"
								>
									<img
										src={getAvatarUrl(otherUser.avatarPath)}
										alt={otherUser.username}
										className="w-10 h-10 object-cover border short:hidden"
									/>
									<div className="flex flex-col short:flex-row short:items-center short:gap-2">
										<span className="font-semibold text-base sm:text-lg">
											{otherUser.username}
										</span>
										<UserStatusComponent
											status={
												otherUser.online
													? "online"
													: "offline"
											}
										/>
									</div>
								</Link>
								<div className="flex items-center gap-2">
									<FriendActionButton uuid={activeUuid} />
								</div>
							</div>

							<div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 min-h-0">
								{isLoading ? (
									<div className="h-full flex items-center justify-center">
										<p className="text-gray-500">
											Loading...
										</p>
									</div>
								) : messages.length === 0 ? (
									<div className="h-full flex flex-col items-center justify-center text-center p-6">
										<p className="text-gray-500">
											No messages yet.
										</p>
										<p className="text-sm text-gray-400 mt-1">
											Send a message to start the
											conversation !
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
									<span className="hidden sm:inline">
										Send
									</span>
								</button>
							</form>
						</>
					) : (
						<div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
							<MessageSquare
								size={48}
								className="mb-2 text-gray-300"
							/>
							<p className="text-lg font-medium">
								Select conversation
							</p>
							<p className="text-sm text-gray-400 mt-1">
								Select a user from the list on the left to start
								chatting.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
