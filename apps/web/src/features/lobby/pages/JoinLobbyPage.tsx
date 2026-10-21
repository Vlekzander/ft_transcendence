import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ErrorComponent from "../../../shared/components/ErrorComponent";
import ActiveLobbyPrompt from "../components/ActiveLobbyPrompt";
import { useActiveLobbyGuard } from "../hooks/useActiveLobbyGuard";
import { joinLobby } from "../services/lobby.service";

export default function JoinLobbyPage() {
	const { joinCode } = useParams<{ joinCode: string }>();
	const navigate = useNavigate();
	const guard = useActiveLobbyGuard();
	const [error, setError] = useState<string | null>(null);
	const hasStarted = useRef(false);
	const { run } = guard;

	useEffect(() => {
		if (!joinCode || hasStarted.current) return;
		hasStarted.current = true;
		void run(async () => {
			const res = await joinLobby(joinCode);
			if (res.ok)
				navigate(`/lobbies/${res.data.uuid}/game`, { replace: true });
			else setError(res.error);
		}, joinCode);
	}, [joinCode, navigate, run]);

	return (
		<>
			{guard.isPrompting && (
				<ActiveLobbyPrompt
					error={guard.error}
					isBusy={guard.isBusy}
					onContinue={() => void guard.confirm()}
					onBack={guard.goBack}
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
