import { useUsers } from "../../lobby/hooks/useUsers";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { GameStatePacket, PublicUserDTO } from "@ft_transcendence/shared";
import { useWsEvent } from "../../websocket/hooks/useWsEvent";
import { useWebSocket } from "../../websocket/context/WebSocketContext";

export function GameScoreboard({
	roomId,
	users,
	isHost,
}: {
	roomId: string;
	users: Record<string, PublicUserDTO>;
	isHost: boolean;
}) {
	const [state, setState] = useState<GameStatePacket | null>(null);
	const { sendPacket, isConnected } = useWebSocket();
	useWsEvent<GameStatePacket>("GAME_STATE", (packet) => {
		if (packet.lobbyUuid === roomId) setState(packet);
	});
	useEffect(() => {
		if (isConnected) sendPacket({ type: "JOIN_GAME", lobbyUuid: roomId });
	}, [roomId, isConnected, sendPacket]);
	const scoreUsers = useUsers(Object.keys(state?.scores ?? {}));
	if (!state?.matchId) return null;
	const finished = state.phase === "FINISHED";
	const entries = Object.entries(state.scores).sort(
		(a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
	);
	const best = entries[0]?.[1] ?? 0;
	const nameOf = (id: string) =>
		users[id]?.username ?? scoreUsers[id]?.username ?? "Player";
	const winners = entries
		.filter(([, score]) => score === best)
		.map(([id]) => nameOf(id));

	return (
		<section
			className="border border-gray-300 p-3 bg-white min-w-0"
			aria-label="Scores"
		>
			{finished && (
				<div
					role="status"
					className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-4 text-center [overflow-wrap:anywhere]"
				>
					<p className="text-xs font-bold uppercase tracking-widest text-primary">
						Game over
					</p>
					<h2 className="mt-2 text-xl font-bold">
						{best === 0
							? "No winner this time"
							: winners.length > 1
								? "It's a tie!"
								: winners[0] + " wins!"}
					</h2>
					<p className="mt-2 text-sm">
						{best === 0
							? "No points were scored during this game."
							: winners.length > 1
								? winners.join(" & ") +
									" share first place with " +
									best +
									" points each."
								: "First place with " + best + " points."}
					</p>
					<p className="mt-3 text-sm">
						To play again, mark yourselves ready. The host can then
						start a new game once the results are saved.
					</p>
				</div>
			)}
			<h2 className="font-bold">
				{finished ? "Final scores" : "Scores"}
			</h2>
			{state.phase === "ROUND_END" && (
				<p role="status">
					The word was{" "}
					<strong>{state.lastTurn?.word ?? "not selected"}</strong>.
					Next turn in a moment…
				</p>
			)}
			<ol className="divide-y">
				{Object.entries(state.scores)
					.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
					.map(([id, score]) => (
						<li
							key={id}
							className="flex gap-3 justify-between py-1"
						>
							<span
								className={`truncate ${
									state.drawerIds.includes(id) &&
									state.phase !== "FINISHED" &&
									state.phase !== "WAITING"
										? "font-bold text-blue-600"
										: ""
								}`}
							>
								{users[id]?.username ??
									scoreUsers[id]?.username ??
									"Player"}
								{state.guessedPlayers.includes(id) &&
								state.phase === "DRAWING"
									? " ✓"
									: ""}
							</span>
							<span>
								{score} pts
								{state.lastTurn?.points[id]
									? ` (+${state.lastTurn.points[id]})`
									: ""}
							</span>
						</li>
					))}
			</ol>
			{finished && (
				<div role="status" className="mt-2 text-sm">
					{state.persistence === "SAVED" ? (
						<>
							Results saved.{" "}
							<Link className="underline" to="/leaderboard">
								Leaderboard
							</Link>
						</>
					) : state.persistence === "FAILED" ? (
						<>
							Results could not be saved.
							{isHost && (
								<button
									className="btn-primary mt-2"
									onClick={() =>
										sendPacket({
											type: "RETRY_GAME_SAVE",
											lobbyUuid: roomId,
										})
									}
								>
									Retry saving
								</button>
							)}
						</>
					) : state.persistence === "CANCELED" ? (
						<>No scores, game results not saved</>
					) : (
						"Saving results…"
					)}
				</div>
			)}
		</section>
	);
}
