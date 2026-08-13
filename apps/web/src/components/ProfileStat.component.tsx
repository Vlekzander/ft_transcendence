import type { ProfileStat } from "@ft_transcendence/shared";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";

export default function ProfileStatComponent({ stat }: { stat: ProfileStat }) {
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
