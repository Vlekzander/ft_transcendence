import type { PublicUserDTO } from "@ft_transcendence/shared";
import { X } from "lucide-react";
import { useState } from "react";
import { AVATARS_PATH } from "../../../config";
import UserStatusComponent from "../../user/components/UserStatus";

type FriendProps = {
	friend: PublicUserDTO;
	onDelete?: () => Promise<void> | void;
};

export default function FriendComponent({ friend, onDelete }: FriendProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!onDelete || isDeleting) return;
		setIsDeleting(true);
		try {
			await onDelete();
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="flex flex-col sm:flex-row justify-between sm:items-center p-2 bg-background">
			<div className="flex gap-2 items-center">
				<div className="w-12 h-12">
					<img
						src={
							friend.avatarPath
								? `${AVATARS_PATH}/${friend.avatarPath}`
								: "/assets/default_avatar.jpg"
						}
						alt={friend.username}
						className="w-full h-full object-cover border"
					/>
				</div>
				<div>
					<a
						href={`/user/${friend.uuid}`}
						className="font-semibold text-lg"
					>
						{friend.username}
					</a>
					<UserStatusComponent
						status={friend.online ? "online" : "offline"}
					/>
				</div>
			</div>
			{onDelete && (
				<div className="flex gap-2 items-center self-end sm:self-auto">
					<button
						type="button"
						onClick={handleDelete}
						disabled={isDeleting}
						className="w-10 h-10 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
					>
						<X strokeWidth={1} />
					</button>
				</div>
			)}
		</div>
	);
}
