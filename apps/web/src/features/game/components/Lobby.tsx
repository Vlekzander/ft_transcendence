import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type {
	LobbyResponseDTO,
	UpdateLobbyDTO,
} from "@ft_transcendence/shared";
import { Check, Copy, Settings, UserPlus } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import LobbySettingsModal from "../../lobby/components/LobbySettingsModal";
import { useUsers } from "../../lobby/hooks/useUsers";
import {
	banPlayer,
	leaveLobby,
	unbanPlayer,
	updateLobbySettings,
	toggleLobbyReady,
	startLobbyGame,
} from "../../lobby/services/lobby.service";

type LobbyProps = {
	lobby: LobbyResponseDTO;
	onLobbyChange: (lobby: LobbyResponseDTO) => void;
};

export default function Lobby({ lobby, onLobbyChange }: LobbyProps) {
	const { user } = useAuth();
	const navigate = useNavigate();
	const uuid = lobby.uuid;
	const [actionError, setActionError] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);
	const [copied, setCopied] = useState(false);
	const users = useUsers([...lobby.connectedPlayers, ...lobby.bannedPlayers]);

	const isHost = user?.uuid === lobby.hostId;
	const canStart = lobby.readyPlayers.length >= 2;
	const nameOf = (id: string) => users[id]?.username ?? "...";

	const runAction = async (
		action: () => Promise<{ ok: boolean; error?: string }>,
	) => {
		const res = await action();
		setActionError(res.ok ? null : (res.error ?? null));
	};

	const handleCopyCode = async () => {
		try {
			await navigator.clipboard.writeText(lobby.joinCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setActionError("Unable to copy the join code");
		}
	};

	const handleCopyInvite = async () => {
		const link = `${window.location.origin}/lobbies/join/${lobby.joinCode}`;
		try {
			await navigator.clipboard.writeText(link);
			setActionError(null);
		} catch {
			setActionError("Unable to copy the invitation link");
		}
	};

	const handleLeave = async () => {
		const res = await leaveLobby(uuid);
		if (res.ok) navigate("/lobbies");
		else setActionError(res.error);
	};

	const handleSave = async (settings: UpdateLobbyDTO) => {
		const res = await updateLobbySettings(uuid, settings);
		if (!res.ok) return res.error;
		onLobbyChange(res.data);
		setShowSettings(false);
		return null;
	};

	const handleReady = async () => {
		const res = await toggleLobbyReady(uuid);
		if (res.ok) onLobbyChange(res.data);
		else setActionError(res.error);
	};

	const handleStart = async () => {
		const res = await startLobbyGame(uuid);
		if (res.ok) onLobbyChange(res.data);
		else setActionError(res.error);
	};

	return (
		<div className="w-full h-full min-h-0 p-5 flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<button
					type="button"
					onClick={() => void handleCopyCode()}
					title="Copy the join code"
					className="flex items-center gap-2 px-4 py-2 border border-primary bg-primary/10 text-primary font-space-mono text-2xl font-bold cursor-pointer hover:bg-primary/20"
				>
					{lobby.joinCode}
					{copied ? <Check size={20} /> : <Copy size={20} />}
				</button>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => void handleCopyInvite()}
						title="Copy invitation link"
						className="btn-primary"
					>
						<UserPlus size={18} />
						Invite
					</button>
					{isHost && (
						<button
							type="button"
							onClick={() => setShowSettings(true)}
							className="btn-primary"
						>
							<Settings size={18} />
							Settings
						</button>
					)}
				</div>
			</div>

			{actionError && <p className="form-alert-error">{actionError}</p>}

			<section className="flex flex-col gap-3">
				<h2 className="font-bold text-xl uppercase tracking-wide text-gray-700">
					Players ({lobby.connectedPlayers.length}/{lobby.maxPlayers})
				</h2>
				<ul className="border border-gray-300 divide-y divide-gray-200">
					{lobby.connectedPlayers.map((id) => (
						<li
							key={id}
							className="flex items-center justify-between gap-3 p-3"
						>
							<span className="font-semibold">
								{nameOf(id)}
								{id === lobby.hostId && (
									<span className="ml-2 text-xs uppercase text-primary">
										host
									</span>
								)}
								{!lobby.gameHasStarted && (
									<span
										className={`ml-2 text-xs uppercase ${
											lobby.readyPlayers.includes(id)
												? "text-primary"
												: "text-gray-400"
										}`}
									>
										{lobby.readyPlayers.includes(id)
											? "ready"
											: "not ready"}
									</span>
								)}
								{lobby.spectatorPlayers.includes(id) && (
									<span className="ml-2 text-xs uppercase text-gray-400">
										spectator
									</span>
								)}
							</span>
							<div className="flex gap-2">
								<Link
									to={`/user/${id}`}
									className="px-3 py-1 border border-gray-400 text-sm hover:bg-gray-400/10"
								>
									View profile
								</Link>
								{isHost && id !== lobby.hostId && (
									<button
										type="button"
										onClick={() =>
											void runAction(() =>
												banPlayer(uuid, id),
											)
										}
										className="px-3 py-1 border border-red-500 text-red-600 text-sm hover:bg-red-500/10 cursor-pointer"
									>
										Ban
									</button>
								)}
							</div>
						</li>
					))}
				</ul>
			</section>

			<section className="mt-auto flex flex-col gap-3">
				<h2 className="font-bold text-xl uppercase tracking-wide text-gray-700">
					Banned players ({lobby.bannedPlayers.length})
				</h2>
				{lobby.bannedPlayers.length === 0 ? (
					<p className="text-sm text-gray-500">No banned player.</p>
				) : (
					<ul className="border border-gray-300 divide-y divide-gray-200">
						{lobby.bannedPlayers.map((id) => (
							<li
								key={id}
								className="flex items-center justify-between gap-3 p-3"
							>
								<span className="font-semibold">
									{nameOf(id)}
								</span>
								{isHost && (
									<button
										type="button"
										onClick={() =>
											void runAction(() =>
												unbanPlayer(uuid, id),
											)
										}
										className="px-3 py-1 border border-gray-400 text-sm hover:bg-gray-400/10 cursor-pointer"
									>
										Unban
									</button>
								)}
							</li>
						))}
					</ul>
				)}
			</section>

			{showSettings && (
				<LobbySettingsModal
					lobby={lobby}
					onSave={handleSave}
					onClose={() => setShowSettings(false)}
				/>
			)}

			<div className="flex w-full gap-2">
				{isHost && (
					<button
						type="button"
						onClick={() => void handleStart()}
						disabled={!lobby.gameHasStarted && !canStart}
						className={`flex-1 px-5 py-2.5 border font-semibold text-sm sm:text-base ${
							lobby.gameHasStarted
								? "border-primary text-primary hover:bg-primary/10"
								: canStart
									? "border-green-500 text-green-500/90 hover:bg-green-500/10"
									: "border-gray-400 text-gray-400 cursor-not-allowed"
						}`}
					>
						{lobby.gameStarted
							? "Pause"
							: lobby.gameHasStarted
								? "Unpause"
								: `Start ? ${lobby.readyPlayers.length}/${lobby.connectedPlayers.length} players ready`}
					</button>
				)}
				{!lobby.gameHasStarted && (
					<button
						type="button"
						onClick={() => void handleReady()}
						disabled={lobby.connectedPlayers.length === 0}
						className="flex-1 px-5 py-2.5 border border-primary text-primary font-semibold text-sm sm:text-base hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{lobby.readyPlayers.includes(user?.uuid ?? "")
							? "Ready"
							: "Ready ?"}
					</button>
				)}
			</div>

			<button
				type="button"
				onClick={() => void handleLeave()}
				className="w-full px-5 py-2.5 border border-gray-400 font-semibold text-sm sm:text-base hover:bg-gray-400/10 cursor-pointer"
			>
				Leave
			</button>
		</div>
	);
}
