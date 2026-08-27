import type { AppPacket } from "@ft_transcendence/shared";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useEffect } from "react";

export function useWsEvent<T extends AppPacket>(
	type: T["type"],
	handler: (packet: T) => void,
) {
	const { registerHandler } = useWebSocket();

	useEffect(() => {
		const wrapped = (packet: AppPacket) => {
			if (packet.type === type) handler(packet as T);
		};
		const unsubscribe = registerHandler(type, wrapped);
		return () => {
			unsubscribe();
		};
	}, [type, handler, registerHandler]);
}
