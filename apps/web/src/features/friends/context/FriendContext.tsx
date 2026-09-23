import type {
	FriendshipDTO,
	PendingFriendRequestDTO,
	SentFriendRequestDTO,
} from "@ft_transcendence/shared";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { useAuth } from "../../auth/context/AuthContext";
import {
	acceptFriendRequest,
	deleteFriendRequest,
	getFriends,
	getPendingRequests,
	getSentRequests,
	sendFriendRequest,
} from "../services/friends.service";

export type RelationStatus =
	| { status: "NONE" }
	| { status: "SELF" }
	| { status: "FRIEND"; uuid: string }
	| { status: "REQUEST_SENT"; uuid: string }
	| { status: "REQUEST_RECEIVED"; uuid: string };

interface FriendContextValue {
	friends: FriendshipDTO[];
	pendingRequests: PendingFriendRequestDTO[];
	sentRequests: SentFriendRequestDTO[];
	isLoading: boolean;
	isActionLoading: boolean;
	getRelationWith: (uuid: string) => RelationStatus;
	sendRequest: (uuid: string) => Promise<boolean>;
	acceptRequest: (uuid: string) => Promise<boolean>;
	cancelOrRefuseRequest: (uuid: string) => Promise<boolean>;
	removeFriend: (uuid: string) => Promise<boolean>;
	refresh: () => Promise<void>;
}

export const FriendContext = createContext<FriendContextValue | null>(null);

export function FriendProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const [friends, setFriends] = useState<FriendshipDTO[]>([]);
	const [pendingRequests, setPendingRequests] = useState<
		PendingFriendRequestDTO[]
	>([]);
	const [sentRequests, setSentRequests] = useState<SentFriendRequestDTO[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(Boolean(user));
	const [isActionLoading, setIsActionLoading] = useState(false);

	const fetchFriendData = useCallback(async () => {
		if (!user) {
			setFriends([]);
			setPendingRequests([]);
			setSentRequests([]);
			setIsLoading(false);
			return;
		}

		try {
			const [friendRes, sentRes, pendingRes] = await Promise.all([
				getFriends(user.uuid),
				getSentRequests(user.uuid),
				getPendingRequests(user.uuid),
			]);

			if (friendRes.ok && friendRes.data) setFriends(friendRes.data);
			if (sentRes.ok && sentRes.data) setSentRequests(sentRes.data);
			if (pendingRes.ok && pendingRes.data)
				setPendingRequests(pendingRes.data);
		} catch (err) {
			console.error("Failed to fetch friendship data:", err);
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	useEffect(() => {
		let isMounted = true;

		void Promise.resolve().then(() => {
			if (isMounted) fetchFriendData();
		});
		return () => {
			isMounted = false;
		};
	}, [fetchFriendData]);

	const getRelationWith = useCallback(
		(uuid: string): RelationStatus => {
			if (!user || user.uuid === uuid) return { status: "SELF" };

			const friendship = friends.find((f) => f.user.uuid === uuid);
			if (friendship) return { status: "FRIEND", uuid: friendship.uuid };

			const sent = sentRequests.find((r) => r.receiver.uuid === uuid);
			if (sent) return { status: "REQUEST_SENT", uuid: sent.uuid };

			const received = pendingRequests.find(
				(r) => r.sender.uuid === uuid,
			);
			if (received)
				return { status: "REQUEST_RECEIVED", uuid: received.uuid };

			return { status: "NONE" };
		},
		[user, friends, sentRequests, pendingRequests],
	);

	const sendRequest = async (uuid: string) => {
		if (!user || isActionLoading) return false;

		try {
			setIsActionLoading(true);
			const res = await sendFriendRequest(user.uuid, uuid);
			if (!res.ok) return false;
			await fetchFriendData();
			return true;
		} finally {
			setIsActionLoading(false);
		}
	};

	const acceptRequest = async (uuid: string) => {
		if (!user || isActionLoading) return false;

		try {
			setIsActionLoading(true);
			const res = await acceptFriendRequest(user.uuid, uuid);
			if (!res.ok) return false;
			await fetchFriendData();
			return true;
		} finally {
			setIsActionLoading(false);
		}
	};

	const cancelOrRefuseRequest = async (uuid: string) => {
		if (!user || isActionLoading) return false;

		try {
			setIsActionLoading(true);
			const res = await deleteFriendRequest(user.uuid, uuid);
			if (!res.ok) return false;
			setSentRequests((prev) => prev.filter((r) => r.uuid !== uuid));
			setPendingRequests((prev) => prev.filter((r) => r.uuid !== uuid));
			return true;
		} finally {
			setIsActionLoading(false);
		}
	};

	const removeFriend = async (uuid: string) => {
		if (!user || isActionLoading) return false;

		try {
			setIsActionLoading(true);
			const res = await deleteFriendRequest(user.uuid, uuid);
			if (!res.ok) return false;
			setFriends((prev) => prev.filter((f) => f.uuid !== uuid));
			return true;
		} finally {
			setIsActionLoading(false);
		}
	};

	const value: FriendContextValue = {
		friends,
		pendingRequests,
		sentRequests,
		isLoading,
		isActionLoading,
		getRelationWith,
		sendRequest,
		acceptRequest,
		cancelOrRefuseRequest,
		removeFriend,
		refresh: fetchFriendData,
	};

	return (
		<FriendContext.Provider value={value}>
			{children}
		</FriendContext.Provider>
	);
}

export function useFriends() {
	const ctx = useContext(FriendContext);
	if (!ctx) throw new Error("useFriends must be used within FriendProvider");
	return ctx;
}
