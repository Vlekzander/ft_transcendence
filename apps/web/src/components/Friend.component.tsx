import type { Status, UserResponseDTO } from "@ft_transcendence/shared";
import { Gamepad2, X } from "lucide-react";
import UserStatusComponent from "./UserStatus.component";

export default function FriendComponent({
	user,
	status,
}: {
	user: UserResponseDTO;
	status: Status;
}) {
	return (
		<div className="flex flex-col sm:flex-row justify-between sm:items-center p-2 bg-background">
			<div className="flex gap-2 items-center">
				<div className="w-12 h-12">
					<img
						src="/assets/default_avatar.jpg"
						className="w-full h-full object-cover border"
					/>
				</div>
				<div>
					<span className="font-semibold text-lg">
						{user.username}
					</span>
					<UserStatusComponent status={status} />
				</div>
			</div>
			<div className="flex gap-2 items-center self-end sm:self-auto">
				{status === "in_game" && (
					<button className="flex items-center gap-1 text-sm text-green-500/90 hover:bg-green-500/10 border border-green-500 p-1 cursor-pointer">
						<Gamepad2 size={20} />
						<span>Join</span>
					</button>
				)}
				<button className="w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 cursor-pointer">
					<X strokeWidth={1} />
				</button>
			</div>
		</div>
	);
}
