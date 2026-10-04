//Should we put players with no wins in lb ?

import { Trophy } from "lucide-react";

import { useEffect, useState } from "react";

import { AVATARS_PATH } from "../../config";

type LeaderboardEntry = {
	username: string;
	uuid: string;
	wins: number;
	avatarPath: string | null;
};

export default function LeaderboardPage() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [currentUser, setCurrentUser] = useState<{
		uuid: string;
		username: string;
	} | null>(null);

	useEffect(() => {
		Promise.all([
			fetch("http://localhost:3000/leaderboard"),
			fetch("http://localhost:3000/auth/whoami", {
				credentials: "include",
			}),
		]).then(async ([leaderboardResponse, whoamiResponse]) => {
			const leaderboardData = await leaderboardResponse.json();
			const whoamiData = await whoamiResponse.json();

			setLeaderboard(leaderboardData.leaderboard);

			if (whoamiData.authenticated) {
				setCurrentUser(whoamiData.user);
			}
		});
	}, []);

	// console.log(currentUser);
	// console.log(leaderboard);

	return (
		<div className="p-10">
			<h1 className="text-4xl font-bold mb-6 flex items-center gap-3">
				<Trophy size={33} />
				Leaderboard
			</h1>

			<div className="flex flex-col gap-2">
				{leaderboard.map((player, index) => {
					const isCurrentUser = currentUser?.uuid === player.uuid;
					return (
						<div
							key={player.uuid}
							className={`flex items-center justify-between border p-4 transition hover:scale-102 hover:shadow-lg
							${
								index === 0
									? "border-yellow-400 bg-yellow-50"
									: index === 1
										? "border-gray-400 bg-gray-50"
										: index === 2
											? "border-orange-400 bg-orange-50"
											: ""
							}
							${isCurrentUser ? "border-4" : ""}
						`}
						>
							<div className="flex items-center gap-3">
								#{index + 1}
								<img
									src={
										player.avatarPath
											? AVATARS_PATH + player.avatarPath
											: "/assets/default_avatar.jpg"
									}
									alt={`${player.username}'s avatar`}
									width={20}
									height={20}
									className="w-5 h-5 object-cover border"
								/>
								<span className="font-medium">
									{player.username}
								</span>
							</div>

							<span>{player.wins} wins</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// <div className="flex flex-col gap-2">
// 	{leaderboard.map((player, index) => (

// 		<div
// 			key={player.uuid}
// 			className={`flex items-center justify-between border p-4 transition hover:scale-102 hover:shadow-lg
// 				${index === 0
// 				? "border-yellow-400 bg-yellow-50"
// 				: index === 1
// 					? "border-gray-400 bg-gray-50"
// 					: index === 2
// 						? "border-orange-400 bg-orange-50"
// 						: ""
// 				}
// 			`}
// 		>
