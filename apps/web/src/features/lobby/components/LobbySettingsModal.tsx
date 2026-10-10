import { useState } from "react";
import {
	DRAW_TIME,
	NB_ROUNDS,
	TIME_TO_CHOOSE_WORD,
	WORD_OPTIONS_PER_TURN,
	type LobbyResponseDTO,
	type LobbyVisibility,
	type UpdateLobbyDTO,
} from "@ft_transcendence/shared";
import { X } from "lucide-react";
import LobbyOptionSelect from "./LobbyOptionSelect";
import ToggleButtons from "./ToggleButtons";
import { DICTIONARY } from "../constants";
import WordsFields from "./WordsFields";

type LobbySettingsModalProps = {
	lobby: LobbyResponseDTO;
	onSave: (settings: UpdateLobbyDTO) => Promise<string | null>;
	onClose: () => void;
};

export default function LobbySettingsModal({
	lobby,
	onSave,
	onClose,
}: LobbySettingsModalProps) {
	const [visibility, setVisibility] = useState<LobbyVisibility>(
		lobby.visibility,
	);
	const [drawTime, setDrawTime] = useState(lobby.drawTime);
	const [numberOfRounds, setNumberOfRounds] = useState(lobby.numberOfRounds);
	const [wordChoicesPerTurn, setWordChoicesPerTurn] = useState(
		lobby.wordChoicesPerTurn,
	);
	const [timeToChooseWord, setTimeToChooseWord] = useState(
		lobby.timeToChooseWord,
	);
	const [onlyCustomWords, setOnlyCustomWords] = useState(
		lobby.usingDictionary === 0,
	);
	const [customWords, setCustomWords] = useState(lobby.customWords ?? "");
	const [dictionary, setDictionary] = useState(
		lobby.usingDictionary === 0
			? DICTIONARY[0].value
			: lobby.usingDictionary,
	);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		if (onlyCustomWords && customWords.trim() === "") {
			setError("At least one custom word is required");
			return;
		}
		setIsSaving(true);
		setError(null);
		const err = await onSave({
			visibility,
			drawTime,
			numberOfRounds,
			wordChoicesPerTurn,
			timeToChooseWord,
			usingDictionary: onlyCustomWords ? 0 : dictionary,
			customWords,
		});
		setIsSaving(false);
		if (err) setError(err);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="lobby-settings-title"
		>
			<div className="form-card max-h-full overflow-y-auto">
				<div className="flex items-center justify-between">
					<h2 id="lobby-settings-title" className="form-title">
						Settings
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close settings"
						className="cursor-pointer text-gray-500 hover:text-foreground"
					>
						<X size={20} />
					</button>
				</div>

				<div className="form-field">
					<span className="form-label">Visibility</span>
					<ToggleButtons
						value={visibility}
						options={["PUBLIC", "PRIVATE"] as const}
						onChange={setVisibility}
					/>
				</div>

				<LobbyOptionSelect
					id="settings-draw-time"
					label="Draw time"
					suffix="s"
					value={drawTime}
					options={DRAW_TIME}
					onChange={setDrawTime}
				/>
				<LobbyOptionSelect
					id="settings-rounds"
					label="Number of rounds"
					value={numberOfRounds}
					options={NB_ROUNDS}
					onChange={setNumberOfRounds}
				/>
				<LobbyOptionSelect
					id="settings-word-choices"
					label="Words per turn"
					value={wordChoicesPerTurn}
					options={WORD_OPTIONS_PER_TURN}
					onChange={setWordChoicesPerTurn}
				/>
				<LobbyOptionSelect
					id="settings-choose-time"
					label="Time to choose a word"
					suffix="s"
					value={timeToChooseWord}
					options={TIME_TO_CHOOSE_WORD}
					onChange={setTimeToChooseWord}
				/>
				<WordsFields
					idPrefix="settings"
					dictionary={dictionary}
					onDictionaryChange={setDictionary}
					onlyCustomWords={onlyCustomWords}
					onOnlyCustomWordsChange={setOnlyCustomWords}
					customWords={customWords}
					onCustomWordsChange={setCustomWords}
				/>

				{error && <p className="form-alert-error">{error}</p>}

				<div className="flex gap-3 justify-end">
					<button
						type="button"
						onClick={onClose}
						className="px-5 py-2.5 border border-gray-400 font-semibold text-sm sm:text-base hover:bg-gray-400/10 cursor-pointer"
					>
						Close
					</button>
					<button
						type="button"
						onClick={() => void handleSave()}
						disabled={isSaving}
						className="btn-primary"
					>
						{isSaving ? "Saving..." : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
