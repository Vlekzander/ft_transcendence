import { Trophy } from "lucide-react";

//ai for the most part
import { useEffect, useState } from "react";

type LeaderboardEntry = {
	username: string;
	wins: number;
};

export default function LeaderboardPage() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

	useEffect(() => {
		fetch("http://localhost:3000/leaderboard")
			.then((response) => response.json())
			.then((data) => setLeaderboard(data.leaderboard));
	}, []);

	return (
		<div className="p-8">
			<h1 className="text-4xl font-bold mb-6 flex items-center gap-3">
				<Trophy size={32} />
				Leaderboard
			</h1>

			<div className="flex flex-col gap-2">
				{leaderboard.map((player, index) => (
					<div
						key={player.username}
						className="flex justify-between border p-4"
					>
						<span>
							#{index + 1} {player.username}
						</span>

						<span>{player.wins} wins</span>
					</div>
				))}
			</div>
		</div>
	);
}
