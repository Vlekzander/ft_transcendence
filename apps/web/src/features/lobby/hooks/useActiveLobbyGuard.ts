import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import type { LobbyResponseDTO } from "@ft_transcendence/shared";
import { getMyLobby, leaveLobby } from "../services/lobby.service";

type PendingAction = {
	lobby: LobbyResponseDTO;
	action: () => Promise<void>;
};

export function useActiveLobbyGuard() {
	const navigate = useNavigate();
	const [pending, setPending] = useState<PendingAction | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isBusy, setIsBusy] = useState(false);

	const run = useCallback(
		async (action: () => Promise<void>, targetJoinCode?: string) => {
			const res = await getMyLobby();
			if (!res.ok || !res.data) return action();
			if (targetJoinCode && res.data.joinCode === targetJoinCode)
				return navigate(`/lobbies/${res.data.uuid}/game`, {
					replace: true,
				});
			setError(null);
			setPending({ lobby: res.data, action });
		},
		[navigate],
	);

	const confirm = useCallback(async () => {
		if (!pending) return;
		setIsBusy(true);
		setError(null);
		const left = await leaveLobby(pending.lobby.uuid);
		setIsBusy(false);
		if (!left.ok) return setError(left.error);
		setPending(null);
		await pending.action();
	}, [pending]);

	const goBack = useCallback(() => {
		if (!pending) return;
		navigate(`/lobbies/${pending.lobby.uuid}/game`, { replace: true });
	}, [pending, navigate]);

	return {
		run,
		isPrompting: pending !== null,
		error,
		isBusy,
		confirm,
		goBack,
	};
}
