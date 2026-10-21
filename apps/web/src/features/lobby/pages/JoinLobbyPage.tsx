import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ErrorComponent from "../../../shared/components/ErrorComponent";
import ActiveLobbyPrompt from "../components/ActiveLobbyPrompt";
import { useActiveLobbyGuard } from "../hooks/useActiveLobbyGuard";
import { joinLobby } from "../services/lobby.service";

export default function JoinLobbyPage() {
	const { joinCode } = useParams<{ joinCode: string }>();
	const navigate = useNavigate();
	const alreadyInLobbyGuard = useActiveLobbyGuard();
	const [error, setError] = useState<string | null>(null);
	const hasStarted = useRef(false);
	const { run } = alreadyInLobbyGuard;

	useEffect(() => {
		if (!joinCode || hasStarted.current) return;
		hasStarted.current = true;
		void run(async () => {
			const res = await joinLobby(joinCode);
			if (res.ok)
				navigate(`/lobbies/${res.data.uuid}`, { replace: true });
			else setError(res.error);
		}, joinCode);
	}, [joinCode, navigate, run]);

	return (
		<>
			{alreadyInLobbyGuard.isPrompting && (
				<ActiveLobbyPrompt
					error={alreadyInLobbyGuard.error}
					isBusy={alreadyInLobbyGuard.isBusy}
					onContinue={() => void alreadyInLobbyGuard.confirm()}
					onBack={alreadyInLobbyGuard.goBack}
				/>
			)}
			{error ? (
				<ErrorComponent
					message={error}
					button_text="Back to lobbies"
					onClick={() => navigate("/lobbies")}
				/>
			) : (
				<p className="p-5">Joining lobby...</p>
			)}
		</>
	);
}
