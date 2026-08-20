import type { Status } from "@ft_transcendence/shared";

export default function UserStatusComponent({ status }: { status: Status }) {
	return (
		<div className="flex items-center gap-1">
			<div
				className={`w-2 h-2 ${status === "online" ? "bg-green-500" : status === "in_game" ? "bg-primary" : "bg-gray-500"}`}
			></div>
			<span className="text-gray-500 text-sm">
				{status === "online"
					? "Online"
					: status === "in_game"
						? "In game"
						: "Offline"}
			</span>
		</div>
	);
}
