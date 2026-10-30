import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { MAX_PLAYERS, type LobbyResponseDTO } from "@ft_transcendence/shared";
import { Plus, RefreshCw, ChevronRight, Tv2 } from "lucide-react";
import { joinLobby, listLobbies } from "../services/lobby.service";
import { useUsers } from "../hooks/useUsers";
import ActiveLobbyPrompt from "../components/ActiveLobbyPrompt";
import { useLobbiesChanged } from "../hooks/useLobbiesChanged";
import { useActiveLobbyGuard } from "../hooks/useActiveLobbyGuard";
import JoinLobbyViaField from "../components/JoinLobbyViaField";
import CreateLobbyModal from "../components/CreateLobbyModal";

export default function LobbiesPage() {
	const navigate = useNavigate();
	const [lobbies, setLobbies] = useState<LobbyResponseDTO[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const alreadyInLobbyGuard = useActiveLobbyGuard();
	const users = useUsers(lobbies.map((lobby) => lobby.hostId));
	const [listError, setListError] = useState<string | null>(null);
	const [joinError, setJoinError] = useState<string | null>(null);
	const [showCreate, setShowCreate] = useState(false);
	const refresh = useCallback(async () => {
		const res = await listLobbies();
		if (res.ok) {
			setLobbies(res.data);
			setListError(null);
		} else {
			setListError(res.error);
		}
		setIsLoading(false);
	}, []);

	const handleJoin = (joinCode: string) =>
		alreadyInLobbyGuard.run(async () => {
			setJoinError(null);
			const res = await joinLobby(joinCode);
			if (res.ok) navigate(`/lobbies/${res.data.uuid}/game`);
			else setJoinError(res.error);
		}, joinCode);

	useLobbiesChanged(refresh);
	return (
		<div className="p-5 flex flex-col gap-6">
			{alreadyInLobbyGuard.isPrompting && (
				<ActiveLobbyPrompt
					error={alreadyInLobbyGuard.error}
					isBusy={alreadyInLobbyGuard.isBusy}
					onContinue={() => void alreadyInLobbyGuard.confirm()}
					onBack={alreadyInLobbyGuard.goBack}
				/>
			)}
			{/* Phone: actions on their own line under the title */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col sm:flex-row">
					<h1 className="text-3xl font-extrabold flex items-center gap-3">
						<Tv2 className="text-primary" size={32} />
						Lobbies
					</h1>
				</div>

				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => void refresh()}
						aria-label="Refresh lobbies"
						className="px-3 border border-gray-400 hover:bg-gray-400/10 cursor-pointer"
					>
						<RefreshCw size={18} />
					</button>
					<JoinLobbyViaField onJoin={handleJoin} />
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="btn-primary"
					>
						<Plus size={18} />
						<span className="max-sm:sr-only">Add a lobby</span>
					</button>
				</div>
			</div>

			{joinError && <p className="form-alert-error">{joinError}</p>}
			{listError && <p className="form-alert-error">{listError}</p>}

			<div className="border border-gray-300">
				<div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_0.5fr] bg-secondary text-xs uppercase font-bold tracking-wider text-gray-600 px-4 py-2 border-b border-gray-300">
					<span>Host</span>
					<span className="text-center">Draw time</span>
					<span className="text-center">Rounds</span>
					<span className="text-center">Words/turn</span>
					<span className="text-center">Players</span>
					<span></span>
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
									className="group flex sm:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 sm:gap-0 w-full px-4 py-3 text-left items-center hover:bg-gray-400/5 cursor-pointer"
								>
									<span className="flex min-w-0 flex-1 flex-col sm:contents">
										<span className="font-semibold [overflow-wrap:anywhere]">
											{users[lobby.hostId]?.username ??
												"..."}
										</span>
										<span className="text-sm text-gray-500 sm:hidden">
											{lobby.drawTime}s ·{" "}
											{lobby.numberOfRounds} rounds ·{" "}
											{lobby.wordChoicesPerTurn} words ·{" "}
											{lobby.connectedPlayers.length}/
											{lobby.maxPlayers ?? MAX_PLAYERS}
										</span>
									</span>
									<span className="hidden sm:block text-center">
										{lobby.drawTime}
									</span>
									<span className="hidden sm:block text-center">
										{lobby.numberOfRounds}
									</span>
									<span className="hidden sm:block text-center">
										{lobby.wordChoicesPerTurn}
									</span>
									<span className="hidden sm:block text-center">
										{lobby.connectedPlayers.length}/
										{lobby.maxPlayers ?? MAX_PLAYERS}
									</span>
									<span className="flex items-center justify-center group-hover:scale-150">
										<ChevronRight
											size={18}
											className="text-gray-400"
										/>
									</span>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
			{showCreate && (
				<CreateLobbyModal onClose={() => setShowCreate(false)} />
			)}
		</div>
	);
}
