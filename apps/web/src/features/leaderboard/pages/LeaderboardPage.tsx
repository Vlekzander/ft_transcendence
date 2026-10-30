import { Trophy, Crown, Medal } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAvatarUrl, getErrorMessage } from "../../../config";
import { AppDomainError, LeaderboardEntry } from "@ft_transcendence/shared";
import { getLeaderboard } from "../services/leaderboad.service";
import ErrorComponent from "../../../shared/components/ErrorComponent";

export default function LeaderboardPage() {
	const { user } = useAuth();
	const [isLoading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

	useEffect(() => {
		let isMounted = true;

		const fetchData = async () => {
			try {
				setLoading(true);
				setError(null);
				const resLeaderboard = await getLeaderboard();
				if (resLeaderboard.ok === false)
					throw new AppDomainError(resLeaderboard.error);

				const resultLeaderboard = resLeaderboard.data;

				if (isMounted) {
					setLeaderboard(resultLeaderboard);
				}
			} catch (error) {
				const message = getErrorMessage(error);
				if (isMounted) setError(message || "An error occured");
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchData();
		return () => {
			isMounted = false;
		};
	}, []);

	if (isLoading) {
		return (
			<div className="p-10 flex justify-center items-center">
				<p className="text-2xl">Loading...</p>
			</div>
		);
	}

	if (error) {
		return (
			<ErrorComponent
				message={error}
				button_text="Retry"
				onClick={() => window.location.reload()}
			/>
		);
	}

	return (
		<div className="p-5 flex flex-col gap-8 justify-center">
			<div className="w-full">
				<div className="flex flex-col sm:flex-row">
					<h1 className="text-3xl font-extrabold flex items-center gap-3">
						<Trophy className="text-primary" size={32} />
						Leaderboard
					</h1>
				</div>
			</div>

			<section className="flex flex-col gap-4">
				{leaderboard.length === 0 ? (
					<div className="border border-gray-300 p-8 text-center bg-background">
						<p className="text-gray-500">
							No players on the leaderboard yet.
						</p>
						<p className="text-sm text-gray-400 mt-1">
							Play and win matches to claim the first spot!
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{leaderboard.map((player, index) => {
							const isCurrentUser = user?.uuid === player.uuid;
							return (
								<Link
									key={player.uuid}
									to={`/user/${player.uuid}`}
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
									${isCurrentUser ? "border-[3.5px] bg-primary/20 font-bold scale-101" : ""}
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
											src={getAvatarUrl(
												player.avatarPath,
											)}
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
								</Link>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
}
