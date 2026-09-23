import type {
	Achievement,
	FriendshipDTO,
	GameHistoryEntry,
	GameParticipant,
	PublicUserDTO,
	Stat,
} from "@ft_transcendence/shared";
import {
	Check,
	ChevronDown,
	Clock,
	Medal,
	Star,
	Trophy,
	UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import FriendComponent from "../components/Friend";
import UserStatusComponent from "../components/UserStatus";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import ProgressBarComponent from "../../../shared/components/Progressbar";
import { Navigate, useParams } from "react-router";
import { API_URL, AVATARS_PATH } from "../../../config";
import {
	PartialProfileError,
	UserNotFoundError,
	UserProfileError,
} from "../../../shared/types/errors";
import ErrorComponent from "../../../shared/components/ErrorComponent";
import { useAuth } from "../../auth/context/AuthContext";
import { useFriends } from "../../friends/context/FriendContext";
import { FriendActionButton } from "../components/FriendActionButton";

function getPlayerGameResult(game: GameHistoryEntry, userId: string) {
	const index = game.participants.findIndex(
		(participant) => participant.userId === userId,
	);

	if (index === -1) {
		return null;
	}

	return {
		position: index + 1,
		points: game.participants[index].score,
	};
}

function formatDuration(totalSeconds: number) {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function extractDateFromUuid(uuid: string) {
	const hexTimestamp = uuid.replace(/-/g, "").slice(0, 12);
	const timestamp = parseInt(hexTimestamp, 16);

	return new Date(timestamp);
}

function StatComponent({ stat }: { stat: Stat }) {
	return (
		<div className="flex flex-col gap-2 p-3 bg-background">
			<DynamicIcon
				name={stat.icon as IconName}
				className="text-primary"
			/>
			<span className="text-2xl font-bold">{stat.value}</span>
			<span className="text-sm">{stat.label}</span>
		</div>
	);
}

function AchievementComponent({ achievement }: { achievement: Achievement }) {
	const progress = Math.round(
		(achievement.current / achievement.objective) * 100,
	);
	return (
		<div className="flex flex-col gap-2 p-3 border border-gray-200">
			<div className="flex gap-2">
				<div
					className={`w-12 h-12 flex items-center justify-center ${progress >= 100 ? "bg-primary text-white" : "border-primary bg-gray-400/15 text-primary"}`}
				>
					{progress >= 100 ? (
						<Check size={32} />
					) : (
						<DynamicIcon
							name={achievement.icon as IconName}
							size={32}
						/>
					)}
				</div>
				<div>
					<div>
						<span className="sm:text-lg font-semibold">
							{achievement.title}
						</span>
					</div>
					<p className="text-sm text-gray-500">
						{achievement.description}
					</p>
				</div>
			</div>
			<div>
				<ProgressBarComponent value={progress} />
				<div className="flex justify-between text-gray-400">
					<span>{Math.min(progress, 100)}%</span>
					<span>
						{Math.min(achievement.current, achievement.objective)}/
						{achievement.objective}
					</span>
				</div>
			</div>
		</div>
	);
}

type GameRankingRowProps = {
	participant: GameParticipant;
	position: number;
	isCurrentUser: boolean;
};

function GameRankingRowComponent({
	participant: participant,
	position,
	isCurrentUser,
}: GameRankingRowProps) {
	return (
		<div
			className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border p-2 sm:px-3 ${isCurrentUser ? "bg-primary/10" : ""} ${position > 1 ? "-mt-px" : ""}`}
		>
			<span>{position}</span>
			<div className="flex items-center gap-5">
				<div className="w-5 h-5">
					<img
						src={
							participant.user.avatarPath === null
								? "/assets/default_avatar.jpg"
								: AVATARS_PATH + participant.user.avatarPath
						}
						alt=""
						width={20}
						height={20}
						className="w-5 h-5 object-cover border"
					/>
				</div>
				<span>{participant.user.username}</span>
			</div>
			<span>{participant.score}</span>
		</div>
	);
}

type GameHistoryItemProp = {
	game: GameHistoryEntry;
	currentUserId: string;
	isOpen: boolean;
	onToggle: () => void;
};

function GameHistoryItem({
	game,
	currentUserId,
	isOpen,
	onToggle,
}: GameHistoryItemProp) {
	const result = getPlayerGameResult(game, currentUserId);

	if (result == null) return null;

	const isVictory = result.position === 1;

	return (
		<article>
			<button
				type="button"
				onClick={onToggle}
				className="w-full flex justify-between items-center border border-gray-400 p-3 sm:px-5 text-sm sm:text-base cursor-pointer transition-colors hover:bg-gray-400/10"
			>
				<div>
					<div className="flex gap-1">
						<span
							className={`uppercase font-semibold px-0.5 border ${isVictory ? "border-green-500 bg-green-500/10 text-green-500/90" : "border-red-500 bg-red-500/10 text-red-500/90"}`}
						>
							{isVictory ? "Victory" : "Defeat"}
						</span>
						<span
							className={`uppercase font-semibold px-0.5 border ${game.mode === "SOLO" ? "border-yellow-500 bg-yellow-500/10 text-yellow-500/90" : "border-purple-500 bg-purple-500/10 text-purple-500/90"}`}
						>
							{game.mode}
						</span>
					</div>
					<span className="font-semibold">
						{extractDateFromUuid(game.uuid).toLocaleDateString(
							"en-US",
							{
								dateStyle: "long",
							},
						)}
					</span>
				</div>
				<div className="flex gap-2">
					<span className="inline-flex items-center gap-1">
						<Medal size={20} strokeWidth={1} />#{result.position}
					</span>
					<span className="inline-flex items-center gap-1">
						<Star size={20} strokeWidth={1} />
						{result.points}
					</span>
					<div
						className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
					>
						<ChevronDown />
					</div>
				</div>
			</button>
			{isOpen && (
				<section
					className={`text-sm sm:text-base border border-gray-400 -my-px`}
				>
					<div className="p-3 sm:px-5">
						<div className="flex flex-col sm:flex-row justify-between">
							<span className="inline-flex gap-2 items-center text-sm">
								<Clock width={20} className="text-primary" />
								<span className="text-gray-500">Duration</span>
								<span className="font-semibold">
									{formatDuration(game.duration)}
								</span>
							</span>
							<span className="inline-flex gap-2 items-center text-sm">
								<UserRound
									width={20}
									className="text-primary"
								/>
								<span className="text-gray-500">Players</span>
								<span className="font-semibold">
									{game.participants.length}
								</span>
							</span>
						</div>
						<h3 className="text-lg text-gray-600 mt-3">
							Game ranking
						</h3>
						<div>
							{game.participants.map((participant, index) => (
								<GameRankingRowComponent
									key={`${game.uuid}-${participant.userId}-${index}`}
									participant={participant}
									position={index + 1}
									isCurrentUser={
										participant.userId === currentUserId
									}
								/>
							))}
						</div>
					</div>
				</section>
			)}
		</article>
	);
}

export default function UserPage() {
	const { user } = useAuth();
	const { uuid } = useParams<{ uuid: string }>();
	const isOwnProfile = user?.uuid === uuid;
	const { friends, removeFriend } = useFriends();
	const [isLoading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [userData, setUserData] = useState<PublicUserDTO | null>(null);
	const [history, setHistory] = useState<GameHistoryEntry[]>([]);
	const [stats, setStats] = useState<Stat[]>([]);
	const [achievements, setAchievements] = useState<Achievement[]>([]);
	const [profileFriends, setProfileFriends] = useState<FriendshipDTO[]>([]);

	const [tab, setTab] = useState<"history" | "achievements" | "friends">(
		"history",
	);
	const [openedGameId, setOpenedGameId] = useState("");

	const toggleGame = (gameId: string) => {
		if (openedGameId === gameId) setOpenedGameId("");
		else setOpenedGameId(gameId);
	};

	useEffect(() => {
		let isMounted = true;

		const fetchData = async () => {
			if (!uuid) return;
			try {
				setLoading(true);
				setError(null);
				const userEndpoint = `${API_URL}/users/${uuid}`;
				const fetches = [
					fetch(`${userEndpoint}`),
					fetch(`${userEndpoint}/history`),
					fetch(`${userEndpoint}/stats`),
					fetch(`${userEndpoint}/achievements`),
					!isOwnProfile
						? fetch(`${userEndpoint}/friends`)
						: Promise.resolve(null),
				];

				const [
					resUser,
					resHistory,
					resStats,
					resAchievements,
					resFriends,
				] = await Promise.all(fetches);
				if (!resUser.ok) {
					if (resUser.status === 404) throw new UserNotFoundError();
					throw new UserProfileError();
				}

				const resultUser = await resUser.json();
				const resultHistory = resHistory.ok
					? await resHistory.json()
					: { history: [] };
				const resultStats = resStats.ok
					? await resStats.json()
					: { stats: [] };
				const resultAchievements = resAchievements.ok
					? await resAchievements.json()
					: { achievements: [] };
				let loadedFriends: FriendshipDTO[] = [];
				if (resFriends && resFriends.ok) {
					const friendsData = await resFriends.json();
					loadedFriends = friendsData.friends || [];
				}
				if (isMounted) {
					setUserData(resultUser.user);
					setHistory(resultHistory.history || []);
					setStats(resultStats.stats || []);
					setAchievements(resultAchievements.achievements || []);
					if (!isOwnProfile) setProfileFriends(loadedFriends);
				}
				if (!resHistory.ok || !resStats.ok || !resAchievements.ok)
					throw new PartialProfileError();
			} catch (error) {
				if (isMounted) setError(error.message || "An error occured");
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchData();
		return () => {
			isMounted = false;
		};
	}, [uuid, isOwnProfile]);

	if (isLoading) {
		return (
			<div className="p-10 flex justify-center items-center">
				<p className="text-2xl">Loading...</p>
			</div>
		);
	}

	if (userData === null) return <Navigate to="/not-found" replace />;

	if (error)
		return (
			<ErrorComponent
				message={error}
				button_text="Retry"
				onClick={() => window.location.reload()}
			/>
		);

	const displayedFriends = isOwnProfile ? friends : profileFriends;

	return (
		<div className="p-5 flex justify-center">
			<div className="w-full sm:w-4/5">
				<div className="flex flex-col sm:flex-row gap-3 items-center">
					<div className="w-32 h-32 shrink-0">
						<img
							src={
								userData.avatarPath === null
									? "/assets/default_avatar.jpg"
									: AVATARS_PATH + userData.avatarPath
							}
							width={128}
							height={128}
							className="w-full h-full object-cover border"
						/>
					</div>
					<div className="w-full sm:w-auto">
						<div className="flex flex-col sm:flex-row gap-2 items-center sm:justify-start">
							<h1 className="text-3xl font-extrabold order-2 sm:order-1">
								{userData.username}
							</h1>
							{!isOwnProfile && (
								<div className="order-1 sm:order-2">
									<FriendActionButton uuid={uuid} />
								</div>
							)}
						</div>
						<div className="flex items-center justify-center sm:justify-start gap-1 m-1">
							<UserStatusComponent
								status={userData.online ? "online" : "offline"}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4 mt-3">
							<div className="flex items-center justify-center sm:justify-start gap-2">
								<Star className="text-orange-400" />
								<div className="flex flex-col">
									<span className="text-xl font-bold">
										48720
									</span>
									<span className="text-gray-500 text-sm">
										points
									</span>
								</div>
							</div>
							<div className="flex items-center justify-center sm:justify-start gap-2">
								<Trophy className="text-primary" />
								<div className="flex flex-col">
									<span className="text-xl font-bold">
										#1
									</span>
									<span className="text-gray-500 text-sm">
										rank
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="mt-7">
					<div className="grid grid-cols-1 sm:grid-cols-5 gap-y-px gap-x-0 sm:gap-y-0 sm:gap-x-px bg-gray-200">
						{stats.map((s, i) => (
							<StatComponent key={i} stat={s} />
						))}
					</div>
				</div>

				<div className="flex w-full border-b border-gray-300">
					{(["history", "achievements", "friends"] as const).map(
						(t) => (
							<button
								key={t}
								onClick={() => setTab(t)}
								className={`uppercase cursor-pointer p-1 sm:p-2 -mb-px border-b-2 hover:text-foreground ${tab === t ? "text-foreground border-foreground" : "text-gray-500 border-transparent"}`}
							>
								{t}
							</button>
						),
					)}
				</div>

				<h2 className="font-bold text-2xl mb-7 capitalize">{tab}</h2>

				{tab === "history" && (
					<div className="flex flex-col gap-2">
						{isLoading ? (
							<p>Loading...</p>
						) : history.length > 0 ? (
							history.map((game) => (
								<GameHistoryItem
									key={game.uuid}
									game={game}
									currentUserId={uuid}
									isOpen={openedGameId === game.uuid}
									onToggle={() => toggleGame(game.uuid)}
								/>
							))
						) : (
							<p>No history found</p>
						)}
					</div>
				)}

				{tab === "achievements" && (
					<div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
							{achievements.map((a) => (
								<AchievementComponent
									key={a.uuid}
									achievement={a}
								/>
							))}
						</div>
					</div>
				)}

				{tab === "friends" && (
					<div>
						<div className="grid grid-cols-1 md:grid-cols-3 bg-gray-200 gap-px border border-gray-200 mt-5">
							{displayedFriends.map((friend) => (
								<FriendComponent
									key={friend.uuid}
									friend={friend.user}
									onDelete={
										isOwnProfile
											? () => {
													void removeFriend(
														friend.uuid,
													);
												}
											: undefined
									}
								/>
							))}
							{friends.length % 3 > 0 &&
								Array.from({
									length: 3 - (friends.length % 3),
								}).map((_, index) => (
									<div
										key={index}
										className="bg-background hidden md:block"
									></div>
								))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
