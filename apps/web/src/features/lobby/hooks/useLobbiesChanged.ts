import { useEffect } from "react";
import { useWebSocket } from "../../websocket/context/WebSocketContext";
import { useWsEvent } from "../../websocket/hooks/useWsEvent";

export function useLobbiesChanged(refresh: () => unknown) {
	const { isConnected } = useWebSocket();
	useEffect(() => {
		void refresh();
	}, [refresh, isConnected]);
	useWsEvent("LOBBIES_CHANGED", refresh);
}
