import { UserRoundPlus, X } from "lucide-react";
import { useFriends } from "../../friends/context/FriendContext";

export function FriendActionButton({ uuid }: { uuid: string }) {
	const {
		getRelationWith,
		sendRequest,
		acceptRequest,
		cancelOrRefuseRequest,
		removeFriend,
		isActionLoading,
	} = useFriends();

	const relation = getRelationWith(uuid);

	if (relation.status === "NONE") {
		return (
			<button
				type="button"
				disabled={isActionLoading}
				onClick={() => sendRequest(uuid)}
				title="Send friend request"
				className="bg-primary/10 text-primary/90 border border-primary font-semibold flex items-center justify-center w-10 h-10 sm:w-7 sm:h-7 hover:bg-primary/20 cursor-pointer disabled:opacity-50"
			>
				<UserRoundPlus strokeWidth={1} />
			</button>
		);
	}
	if (relation.status === "FRIEND") {
		return (
			<button
				type="button"
				disabled={isActionLoading}
				onClick={() => removeFriend(relation.uuid)}
				title="Remove friend"
				className="bg-red-500/10 text-red-500/90 border border-red-500 font-semibold flex items-center justify-center w-10 h-10 sm:w-7 sm:h-7 hover:bg-red-500/20 cursor-pointer disabled:opacity-50"
			>
				<X strokeWidth={1} />
			</button>
		);
	}
	if (relation.status === "REQUEST_SENT") {
		return (
			<button
				type="button"
				disabled={isActionLoading}
				onClick={() => cancelOrRefuseRequest(relation.uuid)}
				title="Cancel friend request"
				className="bg-red-500/10 text-red-500/90 border border-red-500 font-semibold flex items-center justify-center w-10 h-10 sm:w-7 sm:h-7 hover:bg-red-500/20 cursor-pointer disabled:opacity-50"
			>
				<X strokeWidth={1} />
			</button>
		);
	}
	if (relation.status === "REQUEST_RECEIVED") {
		return (
			<div className="flex gap-2">
				<button
					type="button"
					disabled={isActionLoading}
					onClick={() => acceptRequest(relation.uuid)}
					title="Accept friend request"
					className="bg-green-500/10 text-green-500/90 border border-green-500 font-semibold flex items-center justify-center w-10 h-10 sm:w-7 sm:h-7 hover:bg-green-500/20 cursor-pointer disabled:opacity-50"
				>
					<UserRoundPlus strokeWidth={1} />
				</button>
				<button
					type="button"
					disabled={isActionLoading}
					onClick={() => cancelOrRefuseRequest(relation.uuid)}
					title="Refuse friend request"
					className="bg-red-500/10 text-red-500/90 border border-red-500 font-semibold flex items-center justify-center w-10 h-10 sm:w-7 sm:h-7 hover:bg-red-500/20 cursor-pointer disabled:opacity-50"
				>
					<X strokeWidth={1} />
				</button>
			</div>
		);
	}
	return null;
}
