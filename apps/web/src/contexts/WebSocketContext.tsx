import type { AppPacket } from "@ft_transcendence/shared";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	type ReactNode,
} from "react";

type PacketType = AppPacket["type"];
type PacketHandler = (packet: AppPacket) => void;

interface WebSocketContextValue {
	sendPacket: (packet: AppPacket) => void;
	reconnect: () => void;
	registerHandler: (type: PacketType, handler: PacketHandler) => () => void;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(
	null,
);

interface WebSocketProviderProps {
	children: ReactNode;
	wsUrl: string;
}

export function WebSocketProvider({ children, wsUrl }: WebSocketProviderProps) {
	const socketRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<number | null>(null);
	const reconnectAttemptsRef = useRef(0);

	const connectRef = useRef<() => void>(() => {});

	const handlersRef = useRef<Map<PacketType, Set<PacketHandler>>>(new Map());

	const clearReconnectTimeout = () => {
		if (reconnectTimeoutRef.current === null) return;
		window.clearTimeout(reconnectTimeoutRef.current);
		reconnectTimeoutRef.current = null;
	};

	const scheduleReconnect = useCallback(() => {
		const maxAttempts = 10;
		const baseDelay = 1000;
		const maxDelay = 30000;

		if (reconnectAttemptsRef.current >= maxAttempts) return;

		const delay = Math.min(
			baseDelay * 2 ** reconnectAttemptsRef.current,
			maxDelay,
		);
		reconnectAttemptsRef.current += 1;
		reconnectTimeoutRef.current = window.setTimeout(() => {
			connectRef.current();
		}, delay);
	}, []);

	const registerHandler = useCallback(
		(type: PacketType, handler: PacketHandler) => {
			if (!handlersRef.current.has(type))
				handlersRef.current.set(type, new Set());
			handlersRef.current.get(type)!.add(handler);

			return () => {
				const set = handlersRef.current.get(type);
				if (!set) return;
				set.delete(handler);
				if (set.size === 0) handlersRef.current.delete(type);
			};
		},
		[],
	);

	const handlePacket = useCallback((raw: string) => {
		let packet: AppPacket;
		try {
			packet = JSON.parse(raw);
		} catch {
			return;
		}

		const set = handlersRef.current.get(packet.type);
		if (!set) return;

		for (const handler of set) handler(packet);
	}, []);

	const connect = useCallback(() => {
		if (socketRef.current?.readyState === WebSocket.OPEN) return;

		const socket = new WebSocket(wsUrl);

		socket.onopen = () => {
			reconnectAttemptsRef.current = 0;
		};

		socket.onclose = () => {
			socketRef.current = null;
			scheduleReconnect();
		};

		socket.onerror = () => {
			socket.close();
		};

		socket.onmessage = (event) => {
			handlePacket(event.data as string);
		};

		socketRef.current = socket;
	}, [wsUrl, scheduleReconnect]);

	useEffect(() => {
		connect();

		return () => {
			clearReconnectTimeout();
			socketRef.current?.close();
			socketRef.current = null;
		};
	}, [connect]);

	const sendPacket = useCallback((packet: AppPacket) => {
		const socket = socketRef.current;
		if (socket && socket.readyState === WebSocket.OPEN)
			socket.send(JSON.stringify(packet));
	}, []);

	const reconnect = useCallback(() => {
		clearReconnectTimeout();
		reconnectAttemptsRef.current = 0;
		socketRef.current?.close();
		connect();
	}, [connect]);

	const value: WebSocketContextValue = {
		sendPacket,
		reconnect,
		registerHandler,
	};

	return (
		<WebSocketContext.Provider value={value}>
			{children}
		</WebSocketContext.Provider>
	);
}

export function useWebSocket() {
	const ctx = useContext(WebSocketContext);
	if (!ctx)
		throw new Error("useWebSocket must be used within WebSocketProvider");
	return ctx;
}
