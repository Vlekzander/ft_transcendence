import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MAX_PLAYERS, type LobbyResponseDTO } from "@ft_transcendence/shared";
import { Plus, RefreshCw } from "lucide-react";
import { joinLobby, listLobbies } from "../services/lobby.service";
import { useUsers } from "../hooks/useUsers";
import ActiveLobbyPrompt from "../components/ActiveLobbyPrompt";
import { useActiveLobbyGuard } from "../hooks/useActiveLobbyGuard";

const REFRESH_INTERVAL_MS = 5000;

export default function LobbiesPage() {
	const navigate = useNavigate();
	const [lobbies, setLobbies] = useState<LobbyResponseDTO[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const guard = useActiveLobbyGuard();
	const users = useUsers(lobbies.map((lobby) => lobby.hostId));

	const refresh = useCallback(async () => {
		const res = await listLobbies();
		if (res.ok) {
			setLobbies(res.data);
			setError(null);
		} else {
			setError(res.error);
		}
		setIsLoading(false);
	}, []);

	useEffect(() => {
		const initial = setTimeout(() => void refresh(), 0);
		const interval = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
		return () => {
			clearTimeout(initial);
			clearInterval(interval);
		};
	}, [refresh]);

	const handleJoin = (joinCode: string) =>
		guard.run(async () => {
			const res = await joinLobby(joinCode);
			if (res.ok) navigate(`/lobbies/${res.data.uuid}`);
			else setError(res.error);
		}, joinCode);

	return (
		<div className="p-5 flex flex-col gap-6">
			{guard.isPrompting && (
				<ActiveLobbyPrompt
					error={guard.error}
					isBusy={guard.isBusy}
					onContinue={() => void guard.confirm()}
					onBack={guard.goBack}
				/>
			)}
			<div className="flex items-center justify-between gap-3">
				<h1 className="text-3xl font-extrabold">Lobbies</h1>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => void refresh()}
						aria-label="Refresh lobbies"
						className="px-3 border border-gray-400 hover:bg-gray-400/10 cursor-pointer"
					>
						<RefreshCw size={18} />
					</button>
					<Link to="/lobbies/new" className="btn-primary">
						<Plus size={18} />
						Add a lobby
					</Link>
				</div>
			</div>

			{error && <p className="form-alert-error">{error}</p>}

			<div className="border border-gray-300">
				<div className="grid grid-cols-3 bg-secondary text-xs uppercase font-bold tracking-wider text-gray-600 px-4 py-2 border-b border-gray-300">
					<span>Host</span>
					<span>Join code</span>
					<span className="text-right">Players</span>
				</div>
				{isLoading ? (
					<p className="p-4 text-sm text-gray-500">Loading...</p>
				) : lobbies.length === 0 ? (
					<p className="p-4 text-sm text-gray-500">
						No lobby available. Create one!
					</p>
				) : (
					<ul className="divide-y divide-gray-200">
						{lobbies.map((lobby) => (
							<li key={lobby.uuid}>
								<button
									type="button"
									onClick={() =>
										void handleJoin(lobby.joinCode)
									}
									className="grid grid-cols-3 w-full px-4 py-3 text-left hover:bg-gray-400/5 cursor-pointer"
								>
									<span className="font-semibold">
										{users[lobby.hostId]?.username ?? "..."}
									</span>
									<span className="font-space-mono">
										{lobby.joinCode}
									</span>
									<span className="text-right">
										{lobby.connectedPlayers.length}/
										{lobby.maxPlayers ?? MAX_PLAYERS}
									</span>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
