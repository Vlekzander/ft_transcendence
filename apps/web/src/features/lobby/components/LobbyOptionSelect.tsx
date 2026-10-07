type LobbyOptionSelectProps = {
	id: string;
	label: string;
	value: number;
	options: readonly number[];
	suffix?: string;
	onChange: (value: number) => void;
};

export default function LobbyOptionSelect({
	id,
	label,
	value,
	options,
	suffix = "",
	onChange,
}: LobbyOptionSelectProps) {
	return (
		<div className="form-field">
			<label htmlFor={id} className="form-label">
				{label}
			</label>
			<select
				id={id}
				className="form-input"
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
			>
				{options.map((option) => (
					<option key={option} value={option}>
						{option}
						{suffix}
					</option>
				))}
			</select>
		</div>
	);
}
