export default function ProgressBarComponent({ value }: { value: number }) {
	return (
		<div className="w-full bg-gray-200 h-2">
			<div
				className="bg-primary h-2"
				style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
			/>
		</div>
	);
}
