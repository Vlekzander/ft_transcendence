import { MAX_CUSTOM_WORDS } from "@ft_transcendence/shared";
import { DICTIONARY } from "../constants";

type WordsFieldsProps = {
	idPrefix: string;
	dictionary: number;
	onDictionaryChange: (value: number) => void;
	onlyCustomWords: boolean;
	onOnlyCustomWordsChange: (value: boolean) => void;
	customWords: string;
	onCustomWordsChange: (value: string) => void;
};

export default function WordsFields({
	idPrefix,
	dictionary,
	onDictionaryChange,
	onlyCustomWords,
	onOnlyCustomWordsChange,
	customWords,
	onCustomWordsChange,
}: WordsFieldsProps) {
	return (
		<>
			<div className="form-field">
				<label
					htmlFor={`${idPrefix}-dictionary`}
					className="form-label"
				>
					Dictionary
				</label>
				<select
					id={`${idPrefix}-dictionary`}
					className="form-input"
					value={dictionary}
					disabled={onlyCustomWords}
					onChange={(e) => onDictionaryChange(Number(e.target.value))}
				>
					{DICTIONARY.map(({ value, label }) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>
				<label className="flex items-center gap-2 text-sm cursor-pointer">
					<input
						type="checkbox"
						checked={onlyCustomWords}
						onChange={(e) =>
							onOnlyCustomWordsChange(e.target.checked)
						}
					/>
					Only custom words
				</label>
			</div>

			<div className="form-field">
				<label
					htmlFor={`${idPrefix}-custom-words`}
					className="form-label"
				>
					Custom words
				</label>
				<textarea
					id={`${idPrefix}-custom-words`}
					className="form-input"
					rows={3}
					value={customWords}
					onChange={(e) => onCustomWordsChange(e.target.value)}
				/>
				<p className="text-xs text-gray-500">
					enter max {MAX_CUSTOM_WORDS} words separated by a space
				</p>
			</div>
		</>
	);
}
