import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { LobbyResponseDTO } from "@ft_transcendence/shared";
import { useAuth } from "../../auth/context/AuthContext";
import { getLobby, getMyLobby } from "../../lobby/services/lobby.service";
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
	const [lobby, setLobby] = useState<LobbyResponseDTO | null>(null);
	const [error, setError] = useState("");
	const users = useUsers(lobby?.connectedPlayers ?? []);
	useEffect(() => {
		let active = true;
		let timer: ReturnType<typeof setTimeout>;
		const refresh = async () => {
			const result = uuid ? await getLobby(uuid) : await getMyLobby();
			if (!active) return;
			if (result.ok) {
				if (
					!result.data ||
					!userId ||
					!result.data.connectedPlayers.includes(userId)
				) {
					navigate("/lobbies", { replace: true });
					return;
				}
				if (!uuid) {
					navigate(`/game/${result.data.uuid}`, { replace: true });
					return;
				}
				setLobby(result.data);
				setError("");
			} else if (
				result.status === 401 ||
				result.status === 403 ||
				result.status === 404
			) {
				setLobby(null);
				navigate("/lobbies", { replace: true });
				return;
			} else {
				setError(result.error);
			}
			timer = setTimeout(() => void refresh(), 3000);
		};
		void refresh();
		return () => {
			active = false;
			clearTimeout(timer);
		};
	}, [uuid, userId, navigate]);

	if (!lobby)
		return (
			<div className="p-5" role="status">
				{error || "Loading game…"}
			</div>
		);
	return (
		<div className="grow min-h-0 flex flex-row items-stretch gap-2">
			<div className="flex min-h-0 flex-1">
				<Lobby />
			</div>
			<div className="flex min-h-0 flex-1 items-center justify-center">
				<Game />
			</div>
			<div className="flex min-h-0 flex-1">
				<GameChat
					roomId={lobby.uuid}
					playerIds={lobby.connectedPlayers}
					users={users}
				/>
			</div>
		</div>
	);
}
// check comment rendre le dessin live
