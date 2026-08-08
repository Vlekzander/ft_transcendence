import {
	Crown,
	Gamepad2,
	Lightbulb,
	PencilLine,
	Star,
	Trophy,
} from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
	const [tab, setTab] = useState<"history" | "achievements" | "friends">(
		"history",
	);
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
										48 720
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

				{tab === "history" && <div>TODO HISTORY</div>}

				{tab === "achievements" && <div>TODO ACHIEVEMENTS</div>}

				{tab === "friends" && <div>TODO FRIENDS</div>}
			</div>
		</div>
	);
}
