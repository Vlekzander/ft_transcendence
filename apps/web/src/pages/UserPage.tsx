import type {
	Achievement,
	Stat,
	Status,
	UserResponseDTO,
} from "@ft_transcendence/shared";
import {
	Check,
	ChevronDown,
	Clock,
	Crown,
	Medal,
	Star,
	Trophy,
	UserRound,
	UserRoundPlus,
} from "lucide-react";
import { useState } from "react";
import { v7 as uuidv7 } from "uuid";
import FriendComponent from "../components/Friend.component";
import UserStatusComponent from "../components/UserStatus.component";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import ProgressBarComponent from "../components/Progressbar.component";

const achievements: Achievement[] = [
	{
		uuid: crypto.randomUUID(),
		icon: "flame",
		title: "aaa",
		description: "bbb",
		objective: 13,
		current: 1,
	},
	{
		uuid: crypto.randomUUID(),
		icon: "zap",
		title: "ccc",
		description: "ddd",
		objective: 100,
		current: 57,
	},
	{
		uuid: crypto.randomUUID(),
		icon: "user",
		title: "Blablablabla",
		description: "blibliblibli",
		objective: 38,
		current: 192,
	},
];

const stats: Stat[] = [
	{
		icon: "gamepad-2",
		label: "Game Played",
		value: "193",
	},
	{
		icon: "trophy",
		label: "Wins",
		value: "42",
	},
	{
		icon: "lightbulb",
		label: "Words Guessed",
		value: "1247",
	},
	{
		icon: "pencil-line",
		label: "Drawings",
		value: "251",
	},
	{
		icon: "star",
		label: "Best score",
		value: "520",
	},
];

type PlayerGameStats = {
	id: string;
	points: number;
};

type GameHistoryEntry = {
	id: string; //UUIDV7
	durationInSeconds: number;
	mode: "SOLO" | "DUO";
	players: PlayerGameStats[];
};

const userData: UserResponseDTO = {
	uuid: crypto.randomUUID(),
	username: "SpongyBobby",
	email: "spongybobby@gmail.com",
	avatarUuid: null,
};

const fakeHistory: GameHistoryEntry[] = [
	{
		id: uuidv7(),
		durationInSeconds: 345,
		mode: "DUO",
		players: [
			{ id: userData.uuid, points: 200 },
			{ id: "test", points: 100 },
		],
	},
	{
		id: uuidv7(),
		durationInSeconds: 345,
		mode: "SOLO",
		players: [
			{ id: "test", points: 100 },
			{ id: userData.uuid, points: 75 },
			{ id: "test", points: 0 },
		],
	},
];

type friend = {
	user: UserResponseDTO;
	status: Status;
};

const fakeFriendsList: friend[] = [
	{
		user: {
			uuid: crypto.randomUUID(),
			username: "Another",
			email: "spongybobby@gmail.com",
			avatarUuid: null,
		},
		status: "in_game",
	},
	{
		user: {
			uuid: crypto.randomUUID(),
			username: "Blabla",
			email: "spongybobby@gmail.com",
			avatarUuid: null,
		},
		status: "online",
	},
	{
		user: {
			uuid: crypto.randomUUID(),
			username: "Nobody",
			email: "spongybobby@gmail.com",
			avatarUuid: null,
		},
		status: "offline",
	},
];

function getPlayerPosition(game: GameHistoryEntry, uuid: string): number {
	let position = 0;
	game.players.forEach((p, i) => {
		if (p.id === uuid) position = i + 1;
	});

	return position;
}

function getPlayerPoints(game: GameHistoryEntry, uuid: string): number {
	let points = 0;
	game.players.forEach((p) => {
		if (p.id === uuid) points = p.points;
	});

	return points;
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

export default function UserPage() {
	const [tab, setTab] = useState<"history" | "achievements" | "friends">(
		"history",
	);

	const [openedIndex, setOpenedIndex] = useState<number>(-1);

	const toggleIndex = (index: number) => {
		if (openedIndex === index) setOpenedIndex(-1);
		else setOpenedIndex(index);
	};

	return (
		<div className="p-5 flex justify-center">
			<div className="w-full sm:w-4/5">
				<div className="flex flex-col sm:flex-row gap-3 items-center">
					<div className="w-32 h-32 shrink-0">
						<img
							src="/assets/default_avatar.jpg"
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
							<span className="inline-flex items-center gap-1 text-xs border border-primary bg-primary/10 text-primary/90 p-1 whitespace-nowrap order-1 sm:order-2">
								<Crown size={16} />
								Top 10
							</span>
						</div>
						<div className="flex items-center justify-center sm:justify-start gap-1 m-1">
							<UserStatusComponent status="online" />
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
							<StatComponent stat={s} key={i} />
						))}
					</div>
				</div>

				<div className="flex w-full border-b border-gray-300">
					{(["history", "achievements", "friends"] as const).map(
						(t) => (
							<button
								key={t}
								onClick={() => setTab(t)}
								className={`uppercase cursor-pointer p-1 sm:p-2 -mb-px border-b-2 ${tab === t ? "text-foreground border-foreground" : "text-gray-500 border-transparent"}`}
							>
								{t}
							</button>
						),
					)}
				</div>

				<h2 className="font-bold text-2xl mb-7 capitalize">{tab}</h2>

				{tab === "history" && (
					<div className="flex flex-col gap-2">
						{fakeHistory.map((game, index) => (
							<div key={index}>
								<button
									type="button"
									onClick={() => toggleIndex(index)}
									className="w-full flex justify-between items-center border border-gray-400 p-3 sm:px-5 text-sm sm:text-base cursor-pointer transition-colors hover:bg-gray-400/10"
								>
									<div>
										<div className="flex gap-1">
											{getPlayerPosition(
												game,
												userData.uuid,
											) === 1 ? (
												<span className="uppercase font-semibold px-0.5 border border-green-500 bg-green-500/10 text-green-500/90">
													Victory
												</span>
											) : (
												<span className="uppercase font-semibold px-0.5 border border-red-500 bg-red-500/10 text-red-500/90">
													Defeat
												</span>
											)}
											{game.mode === "SOLO" ? (
												<span className="uppercase font-semibold px-0.5 border border-yellow-500 bg-yellow-500/10 text-yellow-500/90">
													Solo
												</span>
											) : (
												<span className="uppercase font-semibold px-0.5 border border-purple-500 bg-purple-500/10 text-purple-500/90">
													DUO
												</span>
											)}
										</div>
										<span className="font-semibold">
											{extractDateFromUuid(
												game.id,
											).toLocaleDateString("en-US", {
												dateStyle: "long",
											})}
										</span>
									</div>
									<div className="flex gap-2">
										<span className="inline-flex items-center gap-1">
											<Medal size={20} strokeWidth={1} />#
											{getPlayerPosition(
												game,
												userData.uuid,
											)}
										</span>
										<span className="inline-flex items-center gap-1">
											<Star size={20} strokeWidth={1} />
											{getPlayerPoints(
												game,
												userData.uuid,
											)}
										</span>
										<div
											className={`transition-transform duration-200 ${openedIndex === index ? "rotate-180" : "rotate-0"}`}
										>
											<ChevronDown />
										</div>
									</div>
								</button>
								<div
									className={`text-sm sm:text-base border border-gray-400 -my-px`}
									hidden={openedIndex !== index}
								>
									<div className="p-3 sm:px-5">
										<div className="flex flex-col sm:flex-row justify-between">
											<span className="inline-flex gap-2 items-center text-sm">
												<Clock
													width={20}
													className="text-primary"
												/>
												<span className="text-gray-500">
													Duration
												</span>
												<span className="font-semibold">
													{`${Math.floor(game.durationInSeconds / 60)}:${game.durationInSeconds % 60}`}
												</span>
											</span>
											<span className="inline-flex gap-2 items-center text-sm">
												<UserRound
													width={20}
													className="text-primary"
												/>
												<span className="text-gray-500">
													Players
												</span>
												<span className="font-semibold">
													{game.players.length}
												</span>
											</span>
										</div>
										<h3 className="text-lg text-gray-600 mt-3">
											Game ranking
										</h3>
										<div>
											{game.players.map(
												(player, index) => (
													<div
														key={index}
														className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border p-2 sm:px-3 ${player.id === userData.uuid ? "bg-primary/10" : ""} ${index > 0 ? "-mt-px" : ""}`}
													>
														<span>{index + 1}</span>
														<div className="flex items-center gap-5">
															<div className="w-5 h-5">
																<img
																	src="/assets/default_avatar.jpg"
																	width={5}
																	height={5}
																	className="w-full h-full object-cover border"
																/>
															</div>
															<span>
																SpongyBobby
															</span>
														</div>
														<span>
															{player.points}
														</span>
													</div>
												),
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{tab === "achievements" && (
					<div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
							{achievements.map((a) => (
								<AchievementComponent
									achievement={a}
									key={a.uuid}
								/>
							))}
						</div>
					</div>
				)}

				{tab === "friends" && (
					<div>
						<button className="bg-primary/10 text-primary/90 border border-primary font-semibold flex gap-2 px-2 py-1.5 hover:bg-primary/20 cursor-pointer">
							<UserRoundPlus />
							Add friend
						</button>
						<div className="grid grid-cols-1 sm:grid-cols-3 bg-gray-200 gap-px border border-gray-200 mt-5">
							{fakeFriendsList.map((friend) => (
								<FriendComponent
									user={friend.user}
									status={friend.status}
									key={friend.user.uuid}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
