import { useCallback, useEffect, useState } from "react";
import type {
	LobbyResponseDTO,
	LobbyUpdatedPacket,
} from "@ft_transcendence/shared";
import { useWebSocket } from "../../websocket/context/WebSocketContext";
import { useWsEvent } from "../../websocket/hooks/useWsEvent";
import { getLobby, getMyLobby } from "../services/lobby.service";

type LobbyFailure = { message: string; status?: number };

export function useLobby(uuid?: string) {
	const { isConnected } = useWebSocket();
	const [lobby, setLobby] = useState<LobbyResponseDTO | null>(null);
	const [failure, setFailure] = useState<LobbyFailure | null>(null);
	const [resolved, setResolved] = useState(false);

	// Fetch on mount and after every (re)connection, to catch missed packets.
	useEffect(() => {
		let active = true;
		void (uuid ? getLobby(uuid) : getMyLobby()).then((res) => {
			if (!active) return;
			if (res.ok) {
				setLobby(res.data);
				setFailure(null);
			} else {
				setFailure({ message: res.error, status: res.status });
			}
			setResolved(true);
		});
		return () => {
			active = false;
		};
	}, [uuid, isConnected]);

	const handleUpdate = useCallback(
		(packet: LobbyUpdatedPacket) => {
			if (uuid && packet.lobby.uuid !== uuid) return;
			setLobby(packet.lobby);
			setFailure(null);
		},
		[uuid],
	);
	useWsEvent("LOBBY_UPDATED", handleUpdate);

	return { lobby, setLobby, failure, resolved };
}
