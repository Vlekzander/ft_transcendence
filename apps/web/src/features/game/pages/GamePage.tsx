import { GameScoreboard } from "../components/GameScoreboard";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../auth/context/AuthContext";
import { useLobby } from "../../lobby/hooks/useLobby";
import { useUsers } from "../../lobby/hooks/useUsers";
import Game from "../components/Game";
import { GameChat } from "../components/GameChat";
import Lobby from "../components/Lobby";

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
	return (
		<div className="grow min-h-0 grid grid-cols-1 xl:grid-cols-[18rem_minmax(0,1fr)_22rem] items-start gap-3 p-2">
			<div className="flex min-h-0 flex-1">
				<Lobby lobby={lobby} onLobbyChange={setLobby} />
			</div>
			<div className="flex min-h-0 flex-1 items-center justify-center">
				<Game gameStarted={lobby.gameStarted} />
			</div>
			<div className="min-w-0 flex flex-col gap-3">
				<GameScoreboard
					roomId={lobby.uuid}
					users={users}
					isHost={userId === lobby.hostId}
				/>
				<GameChat
					roomId={lobby.uuid}
					playerIds={lobby.connectedPlayers}
					spectatorIds={lobby.spectatorPlayers}
					users={users}
				/>
			</div>
		</div>
	);
}
// check comment rendre le dessin live
