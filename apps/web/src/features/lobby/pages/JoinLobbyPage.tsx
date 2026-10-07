import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ErrorComponent from "../../../shared/components/ErrorComponent";
import { joinLobby } from "../services/lobby.service";

/** Target of the shareable lobby link: joins by code, then opens the lobby. */
export default function JoinLobbyPage() {
	const { joinCode } = useParams<{ joinCode: string }>();
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let isCurrent = true;
		const join = async () => {
			if (!joinCode) return;
			const res = await joinLobby(joinCode);
			if (!isCurrent) return;
			if (res.ok)
				navigate(`/lobbies/${res.data.uuid}`, { replace: true });
			else setError(res.error);
		};
		void join();
		return () => {
			isCurrent = false;
		};
	}, [joinCode, navigate]);

	if (error)
		return (
			<ErrorComponent
				message={error}
				button_text="Back to lobbies"
				onClick={() => navigate("/lobbies")}
			/>
		);
	return <p className="p-5">Joining lobby...</p>;
}
