import {
	Check,
	ChevronDown,
	Clock,
	Crown,
	Flame,
	Gamepad2,
	Lightbulb,
	Medal,
	PencilLine,
	Star,
	Trophy,
	UserRound,
	UserRoundPlus,
	X,
} from "lucide-react";
import { useState } from "react";

function ProgressBar({ value }: { value: number }) {
	return (
		<div className="w-full bg-gray-200 h-2">
			<div
				className="bg-primary h-2"
				style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
			/>
		</div>
	);
}

export default function ProfilePage() {
	const [tab, setTab] = useState<"history" | "achievements" | "friends">(
		"history",
	);

	const [openedIndex, setOpenedIndex] = useState<number[]>([]);

	const toggleIndex = (index: number) => {
		if (openedIndex.includes(index))
			setOpenedIndex(openedIndex.filter((i) => i !== index));
		else setOpenedIndex([...openedIndex, index]);
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
								SpongyBobby
							</h1>
							<span className="inline-flex items-center gap-1 text-xs border border-primary bg-primary/10 text-primary/90 p-1 whitespace-nowrap order-1 sm:order-2">
								<Crown size={16} />
								Top 10
							</span>
						</div>
						<div className="flex items-center justify-center sm:justify-start gap-1 m-1">
							<div className="w-2 h-2 bg-green-500"></div>
							<span className="text-gray-500 text-sm">
								Online
							</span>
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
						<div className="flex flex-col gap-2 p-3 bg-background">
							<Gamepad2 className="text-primary" />
							<span className="text-2xl font-bold">193</span>
							<span className="text-sm">Games played</span>
						</div>
						<div className="flex flex-col gap-2 p-3 bg-background">
							<Trophy className="text-primary" />
							<span className="text-2xl font-bold">98</span>
							<span className="text-sm">Wins</span>
						</div>
						<div className="flex flex-col gap-2 p-3 bg-background">
							<Lightbulb className="text-primary" />
							<span className="text-2xl font-bold">1247</span>
							<span className="text-sm">Words guessed</span>
						</div>
						<div className="flex flex-col gap-2 p-3 bg-background">
							<PencilLine className="text-primary" />
							<span className="text-2xl font-bold">251</span>
							<span className="text-sm">Drawings</span>
						</div>
						<div className="flex flex-col gap-2 p-3 bg-background">
							<Star className="text-primary" />
							<span className="text-2xl font-bold">5200</span>
							<span className="text-sm">Best score</span>
						</div>
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

				{tab === "history" && (
					<div>
						<h2 className="font-bold text-2xl mb-7">
							Game history
						</h2>
						<button
							type="button"
							onClick={() => toggleIndex(0)}
							className="w-full flex justify-between items-center border border-gray-400 p-3 sm:px-5 text-sm sm:text-base cursor-pointer transition-colors hover:bg-gray-400/10"
						>
							<div>
								<div className="flex gap-1">
									<span className="uppercase font-semibold px-0.5 border border-green-500 bg-green-500/10 text-green-500/90">
										Victory
									</span>
									<span className="uppercase font-semibold px-0.5 border border-yellow-500 bg-yellow-500/10 text-yellow-500/90">
										Solo
									</span>
								</div>
								<span className="font-semibold">
									08 Août 2026
								</span>
							</div>
							<div className="flex gap-2">
								<span className="inline-flex items-center gap-1">
									<Medal size={20} strokeWidth={1} />
									#1
								</span>
								<span className="inline-flex items-center gap-1">
									<Star size={20} strokeWidth={1} />
									1903
								</span>
								<div
									className={`transition-transform duration-200 ${openedIndex.includes(0) ? "rotate-180" : "rotate-0"}`}
								>
									<ChevronDown />
								</div>
							</div>
						</button>
						<div
							className={`text-sm sm:text-base border border-gray-400 -my-px transition-all duration-300 ${openedIndex.includes(0) ? "opacity-100" : "max-h-0 opacity-0"}`}
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
											14:00
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
										<span className="font-semibold">4</span>
									</span>
								</div>
								<h3 className="text-lg text-gray-600 mt-3">
									Game ranking
								</h3>
								<div>
									<div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border p-2 sm:px-3 bg-primary/10">
										<span>1</span>
										<div className="flex items-center gap-5">
											<div className="w-5 h-5">
												<img
													src="/assets/default_avatar.jpg"
													width={5}
													height={5}
													className="w-full h-full object-cover border"
												/>
											</div>
											<span>SpongyBobby</span>
										</div>
										<span>1903</span>
									</div>
									<div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border p-2 sm:px-3 -mt-px">
										<span>2</span>
										<div className="flex items-center gap-5">
											<div className="w-5 h-5">
												<img
													src="/assets/default_avatar.jpg"
													width={5}
													height={5}
													className="w-full h-full object-cover border"
												/>
											</div>
											<span>SpongyBobby</span>
										</div>
										<span>1756</span>
									</div>
									<div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border p-2 sm:px-3 -mt-px">
										<span>3</span>
										<div className="flex items-center gap-5">
											<div className="w-5 h-5">
												<img
													src="/assets/default_avatar.jpg"
													width={5}
													height={5}
													className="w-full h-full object-cover border"
												/>
											</div>
											<span>SpongyBobby</span>
										</div>
										<span>1234</span>
									</div>
									<div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border p-2 sm:px-3 -mt-px">
										<span>4</span>
										<div className="flex items-center gap-5">
											<div className="w-5 h-5">
												<img
													src="/assets/default_avatar.jpg"
													width={5}
													height={5}
													className="w-full h-full object-cover border"
												/>
											</div>
											<span>SpongyBobby</span>
										</div>
										<span>1111</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{tab === "achievements" && (
					<div>
						<h2 className="font-bold text-2xl mb-7">
							Achievements
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
							<div className="flex flex-col gap-2 p-3 border border-gray-200 border-l-gray-400 border-l-3">
								<div className="flex gap-2">
									<div className="w-12 h-12 bg-primary flex items-center justify-center text-white">
										<Check size={32} />
									</div>
									<div>
										<div>
											<span className="sm:text-lg font-semibold">
												Blabliblou
											</span>
											<span className="uppercase bg-gray-400/10 text-gray-400/90 border border-gray-400 px-1 mx-1.5">
												Common
											</span>
										</div>
										<p className="text-sm text-gray-500">
											blablabla blabla blablabla
										</p>
									</div>
								</div>
								<div>
									<ProgressBar value={100} />
									<div className="flex justify-between text-gray-400">
										<span>100%</span>
										<span>X/Y</span>
									</div>
								</div>
							</div>
							<div className="flex flex-col gap-2 p-3 border border-gray-200">
								<div className="flex gap-2">
									<div className="w-12 h-12 border border-primary bg-gray-400/15 flex items-center justify-center text-primary">
										<Flame size={32} />
									</div>
									<div>
										<div>
											<span className="sm:text-lg font-semibold">
												Blabliblou
											</span>
											<span className="uppercase bg-purple-400/10 text-purple-400/90 border border-purple-400 px-1 mx-1.5">
												Epic
											</span>
										</div>
										<p className="text-sm text-gray-500">
											blablabla blabla blablabla
										</p>
									</div>
								</div>
								<div>
									<ProgressBar value={13} />
									<div className="flex justify-between text-gray-400">
										<span>13%</span>
										<span>X/Y</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{tab === "friends" && (
					<div>
						<h2 className="font-bold text-2xl mb-7">Friends</h2>
						<button className="bg-primary/10 text-primary/90 border border-primary font-semibold flex gap-2 px-2 py-1.5 hover:bg-primary/20 cursor-pointer">
							<UserRoundPlus />
							Add friend
						</button>
						<div className="grid grid-cols-1 sm:grid-cols-3 bg-gray-200 gap-px border border-gray-200 mt-5">
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
											SpongyBobby
										</span>
										<div className="flex items-center gap-1">
											<div className="w-2 h-2 bg-purple-500"></div>
											<span className="text-gray-500 text-sm">
												In game
											</span>
										</div>
									</div>
								</div>
								<div className="flex gap-2 items-center self-end sm:self-auto">
									<button className="flex items-center gap-1 text-sm text-green-500/90 hover:bg-green-500/10 border border-green-500 p-1 cursor-pointer">
										<Gamepad2 size={20} />
										<span>Join</span>
									</button>
									<button className="w-10 h-10 sm:w-5 sm:h-5 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 cursor-pointer">
										<X strokeWidth={1} />
									</button>
								</div>
							</div>
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
											SpongyBobby
										</span>
										<div className="flex items-center gap-1">
											<div className="w-2 h-2 bg-green-500"></div>
											<span className="text-gray-500 text-sm">
												Online
											</span>
										</div>
									</div>
								</div>
								<div className="flex gap-2 items-center self-end sm:self-auto">
									<button className="w-10 h-10 sm:w-5 sm:h-5 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 cursor-pointer">
										<X strokeWidth={1} />
									</button>
								</div>
							</div>
							<div className="bg-background"></div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
