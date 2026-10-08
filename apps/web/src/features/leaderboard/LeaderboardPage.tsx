//Add some confettis if the current player is 1st ? need dependencies if yes ...

import { Trophy, Crown, Medal } from "lucide-react";

import { useAuth } from "../auth/context/AuthContext";

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
	const { user } = useAuth();

	useEffect(() => {
		fetch("http://localhost:3000/leaderboard")
			.then((response) => response.json())
			.then((data) => setLeaderboard(data.leaderboard));
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
					const isCurrentUser = user?.uuid === player.uuid;
					return (
						<div
							key={player.uuid}
							className={`flex items-center justify-between border-2 p-3 transition hover:scale-102 hover:shadow-lg
							${
								index === 0
									? "border-yellow-400"
									: index === 1
										? "border-gray-400"
										: index === 2
											? "border-orange-400"
											: ""
							}
							${isCurrentUser ? "border-5 bg-green-50 text-xl font-bold scale-101" : ""}
									`}
						>
							<div className="flex items-center gap-3">
								{index === 0 ? (
									<Crown
										className="text-yellow-400"
										size={30}
									/>
								) : index === 1 ? (
									<Medal
										className="text-gray-400"
										size={29}
									/>
								) : index === 2 ? (
									<Medal
										className="text-orange-300"
										size={27}
									/>
								) : (
									`#${index + 1}`
								)}
								<img
									src={
										player.avatarPath
											? AVATARS_PATH + player.avatarPath
											: "/assets/default_avatar.jpg"
									}
									alt={`${player.username}'s avatar`}
									width={20}
									height={20}
									className="w-10 h-10 object-cover border"
								/>
								<span
									className={
										isCurrentUser
											? "font-[600] text-xl"
											: "font-medium"
									}
								>
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
