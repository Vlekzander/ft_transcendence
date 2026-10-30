import { GameScoreboard } from "../components/GameScoreboard";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../auth/context/AuthContext";
import { useLobby } from "../../lobby/hooks/useLobby";
import { useUsers } from "../../lobby/hooks/useUsers";
import Game from "../components/Game";
import { GameChat } from "../components/GameChat";
import Lobby from "../components/Lobby";

type Tab = "scores" | "lobby" | "chat";
const TABS: { id: Tab; label: string }[] = [
	{ id: "scores", label: "Scores" },
	{ id: "lobby", label: "Lobby" },
	{ id: "chat", label: "Chat" },
];

export default function GamePage() {
	const { uuid } = useParams<{ uuid: string }>();
	return <GameRoom key={uuid ?? "current"} uuid={uuid} />;
}

function GameRoom({ uuid }: { uuid?: string }) {
	const { user } = useAuth();
	const userId = user?.uuid;
	const navigate = useNavigate();
	const { lobby, setLobby, failure, resolved } = useLobby(uuid);
	const users = useUsers(lobby?.connectedPlayers ?? []);
	const isMember = !!userId && !!lobby?.connectedPlayers.includes(userId);
	const [chosenTab, setChosenTab] = useState<Tab | null>(null);
	const [unreadChat, setUnreadChat] = useState(false);

	useEffect(() => {
		if (
			failure?.status === 401 ||
			failure?.status === 403 ||
			failure?.status === 404
		) {
			void navigate("/lobbies", { replace: true });
			return;
		}
		if (!resolved || failure || !userId) return;
		if (!lobby) {
			void navigate("/lobbies", { replace: true });
			return;
		}
		if (!uuid) {
			void navigate(`/game/${lobby.uuid}`, { replace: true });
			return;
		}
		if (isMember) return;
		// Not a player: banned users go back to the list, others join by code.
		void navigate(
			lobby.bannedPlayers.includes(userId)
				? "/lobbies"
				: `/lobbies/join/${lobby.joinCode}`,
			{ replace: true },
		);
	}, [uuid, userId, lobby, failure, resolved, isMember, navigate]);

	if (!lobby || !isMember)
		return (
			<div className="p-5" role="status">
				{failure?.message ?? "Loading game…"}
			</div>
		);
	const tab = chosenTab ?? (lobby.gameHasStarted ? "chat" : "lobby");
	const selectTab = (id: Tab) => {
		setChosenTab(id);
		setUnreadChat(false);
	};
	const panelClass = (id: Tab) =>
		`row-start-3 col-start-1 min-h-0 min-w-0 overflow-y-auto sm:row-start-2 sm:block land:col-start-2 ${tab === id ? "" : "hidden land:hidden"}`;
	return (
		<div className="grid h-[calc(100dvh-4rem)] grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 p-2 sm:grid-cols-3 sm:grid-rows-[auto_minmax(0,1fr)] land:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
			<div className="row-start-1 col-start-1 w-full min-w-0 max-w-[calc((100dvh-12rem)*16/9)] justify-self-center sm:col-span-3 land:col-span-1 land:row-span-2 xl:col-span-1 xl:col-start-2 xl:row-span-2">
				<Game gameStarted={lobby.gameStarted} />
			</div>
			<div
				role="tablist"
				aria-label="Game panels"
				className="row-start-2 col-start-1 flex border border-gray-300 bg-white sm:hidden land:flex land:row-start-1 land:col-start-2"
			>
				{TABS.map(({ id, label }) => (
					<button
						key={id}
						type="button"
						role="tab"
						aria-selected={tab === id}
						aria-controls={`panel-${id}`}
						onClick={() => selectTab(id)}
						className={`relative flex-1 py-2 text-sm font-semibold ${tab === id ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"}`}
					>
						{label}
						{id === "chat" && unreadChat && tab !== "chat" && (
							<>
								<span
									aria-hidden="true"
									className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"
								/>
								<span className="sr-only"> (new messages)</span>
							</>
						)}
					</button>
				))}
			</div>
			<div
				id="panel-lobby"
				className={`${panelClass("lobby")} sm:col-start-1 xl:col-start-1 xl:row-start-1 xl:row-span-2`}
			>
				<Lobby lobby={lobby} onLobbyChange={setLobby} />
			</div>
			<div
				id="panel-scores"
				className={`${panelClass("scores")} sm:col-start-2 xl:col-start-3 xl:row-start-1`}
			>
				<GameScoreboard
					roomId={lobby.uuid}
					users={users}
					isHost={userId === lobby.hostId}
				/>
			</div>
			<div
				id="panel-chat"
				className={`${panelClass("chat")} sm:col-start-3 xl:row-start-2`}
			>
				<GameChat
					roomId={lobby.uuid}
					playerIds={lobby.connectedPlayers}
					spectatorIds={lobby.spectatorPlayers}
					users={users}
					onIncomingMessage={() => setUnreadChat(true)}
				/>
			</div>
		</div>
	);
}
// check comment rendre le dessin live
