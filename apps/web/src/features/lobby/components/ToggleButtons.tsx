type ToggleButtonsProps<T extends string> = {
	value: T;
	options: readonly T[];
	onChange: (value: T) => void;
};

export default function ToggleButtons<T extends string>({
	value,
	options,
	onChange,
}: ToggleButtonsProps<T>) {
	return (
		<div className="flex" role="radiogroup">
			{options.map((option) => (
				<button
					key={option}
					type="button"
					role="radio"
					aria-checked={value === option}
					onClick={() => onChange(option)}
					className={`flex-1 px-4 py-2 border text-sm font-semibold uppercase cursor-pointer ${
						value === option
							? "bg-primary text-white border-primary"
							: "border-gray-400 hover:bg-gray-400/10"
					}`}
				>
					{option}
				</button>
			))}
		</div>
	);
}
