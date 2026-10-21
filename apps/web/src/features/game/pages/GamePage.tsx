import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { LobbyResponseDTO } from "@ft_transcendence/shared";
import { useAuth } from "../../auth/context/AuthContext";
import { getLobby, getMyLobby } from "../../lobby/services/lobby.service";
import { useUsers } from "../../lobby/hooks/useUsers";
import Game from "../components/Game";
import { GameChat } from "../components/GameChat";

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
		<div className="w-full min-w-0 p-4 sm:p-6 flex flex-col gap-5">
			<header className="flex flex-wrap justify-between items-center gap-3">
				<div>
					<h1 className="text-2xl font-bold">
						Game · {lobby.joinCode}
					</h1>
					<p className="text-sm text-gray-500">
						{lobby.connectedPlayers.length} players
					</p>
				</div>
				<Link to={`/lobbies/${lobby.uuid}`} className="btn-primary">
					Back to lobby
				</Link>
			</header>
			{error && (
				<p role="alert" className="form-alert-error">
					{error}
				</p>
			)}
			<div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] items-start gap-5">
				<GameChat
					key={lobby.uuid}
					roomId={lobby.uuid}
					playerIds={lobby.connectedPlayers}
					users={users}
				/>
				<section aria-label="Drawing board" className="min-w-0">
					<Game />
				</section>
			</div>
		</div>
	);
}
