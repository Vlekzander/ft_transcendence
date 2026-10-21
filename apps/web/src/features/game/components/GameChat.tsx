import { useEffect, useRef, useState, type FormEvent } from "react";
import type {
	GameChatErrorPacket,
	GameChatEventPacket,
	PublicUserDTO,
} from "@ft_transcendence/shared";
import { useAuth } from "../../auth/context/AuthContext";
import { useWebSocket } from "../../websocket/context/WebSocketContext";
import { useWsEvent } from "../../websocket/hooks/useWsEvent";

export function GameChat({
	roomId,
	playerIds,
	users,
}: {
	roomId: string;
	playerIds: string[];
	users: Record<string, PublicUserDTO>;
}) {
	const { user } = useAuth();
	const { sendPacket, isConnected, reconnect } = useWebSocket();
	const [content, setContent] = useState("");
	const [events, setEvents] = useState<GameChatEventPacket[]>([]);
	const [error, setError] = useState("");
	const [pending, setPending] = useState<string | null>(null);
	const logRef = useRef<HTMLDivElement>(null);
	const isPlayer = !!user && playerIds.includes(user.uuid);

	const receive = (packet: GameChatEventPacket) => {
		if (!isPlayer || packet.roomId !== roomId) return;
		setEvents((previous) =>
			previous.some((event) => event.id === packet.id)
				? previous
				: [...previous.slice(-199), packet],
		);
		if (packet.sender === user?.uuid && packet.requestId === pending) {
			setPending(null);
			setContent("");
			setError("");
		}
	};
	useWsEvent<GameChatEventPacket>("GAME_CHAT_MESSAGE", receive);
	useWsEvent<GameChatEventPacket>("GAME_CHAT_GUESS", receive);
	useWsEvent<GameChatErrorPacket>("GAME_CHAT_ERROR", (packet) => {
		if (packet.roomId === roomId && packet.requestId === pending) {
			setError(packet.text);
			setPending(null);
		}
	});
	useEffect(() => {
		const log = logRef.current;
		if (log) log.scrollTop = log.scrollHeight;
	}, [events]);
	useEffect(() => {
		if (!pending) return;
		const timer = window.setTimeout(() => {
			setPending(null);
			setError(
				"Delivery was not confirmed. Check the chat before sending again.",
			);
		}, 8000);
		return () => window.clearTimeout(timer);
	}, [pending]);

	if (!isPlayer) return null;
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!content.trim() || pending) return;
		const requestId = crypto.randomUUID();
		setError("");
		if (
			sendPacket({
				type: "SEND_GAME_CHAT",
				roomId,
				requestId,
				content: content.trim(),
			})
		) {
			setPending(requestId);
		} else {
			setError("Chat disconnected. Reconnect to send your message.");
		}
	}
	const nameOf = (id: string) =>
		id === user?.uuid ? "You" : (users[id]?.username ?? "Player");
	return (
		<section
			aria-label="Game chat"
			className="min-w-0 flex flex-col border border-gray-300 bg-white shadow-sm"
		>
			<header className="flex items-center justify-between gap-2 p-4 border-b border-gray-200">
				<h2 className="font-bold text-lg">Game chat</h2>
				<span
					className={`text-xs ${isConnected ? "text-green-700" : "text-amber-700"}`}
					role="status"
				>
					{isConnected ? "Connected" : "Disconnected"}
				</span>
			</header>
			<div
				ref={logRef}
				role="log"
				aria-live="polite"
				aria-relevant="additions"
				className="h-80 xl:h-96 overflow-y-auto p-4 flex flex-col gap-3"
			>
				{events.length === 0 && (
					<p className="text-sm text-gray-500">
						Send a message to the players in this game.
					</p>
				)}
				{events.map((event) => (
					<div
						key={event.id}
						className="text-sm break-words [overflow-wrap:anywhere]"
					>
						{event.type === "GAME_CHAT_GUESS" ? (
							<p className="rounded bg-green-50 p-2 text-green-800">
								{nameOf(event.sender)} guessed correctly!
							</p>
						) : (
							<>
								<span className="font-bold text-primary">
									{nameOf(event.sender)}
								</span>
								<p className="whitespace-pre-wrap text-gray-800">
									{event.content}
								</p>
							</>
						)}
					</div>
				))}
			</div>
			<div className="p-3 border-t border-gray-200">
				{error && (
					<p role="alert" className="text-sm text-red-700 mb-2">
						{error}
					</p>
				)}
				{!isConnected && (
					<button
						type="button"
						onClick={reconnect}
						className="text-sm underline mb-2"
					>
						Reconnect
					</button>
				)}
				<form onSubmit={submit} className="flex gap-2">
					<input
						aria-label="Chat message"
						placeholder="Write a message…"
						maxLength={500}
						value={content}
						disabled={!!pending}
						onChange={(event) => setContent(event.target.value)}
						className="min-w-0 flex-1 border border-gray-300 p-2 text-sm focus:outline-primary"
					/>
					<button
						type="submit"
						disabled={!isConnected || !!pending || !content.trim()}
						className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{pending ? "Sending…" : "Send"}
					</button>
				</form>
				<p className="mt-2 text-xs text-gray-500">
					{content.length}/500 · Messages are not saved.
				</p>
			</div>
		</section>
	);
}
