import { Check } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { Achievement } from "@ft_transcendence/shared";
import ProgressBarComponent from "./Progressbar.component";

export default function AchievementCardComponent({
	achievement,
}: {
	achievement: Achievement;
}) {
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
