import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
	CreateLobbySchema,
	DRAW_TIME,
	MAX_CUSTOM_WORDS,
	NB_ROUNDS,
	TIME_TO_CHOOSE_WORD,
	WORD_OPTIONS_PER_TURN,
	type CreateLobbyDTO,
	type LobbyGameMode,
	type LobbyVisibility,
} from "@ft_transcendence/shared";
import { createLobby } from "../services/lobby.service";
import LobbyOptionSelect from "../components/LobbyOptionSelect";
import ToggleButtons from "../components/ToggleButtons";

const DEFAULTS = CreateLobbySchema.parse({});
const DIFFICULTIES = [
	{ value: 1, label: "Easy" },
	{ value: 2, label: "Medium" },
];

export default function CreateLobbyPage() {
	const navigate = useNavigate();
	const [mode, setMode] = useState<LobbyGameMode>(DEFAULTS.mode);
	const [visibility, setVisibility] = useState<LobbyVisibility>(
		DEFAULTS.visibility,
	);
	const [drawTime, setDrawTime] = useState(DEFAULTS.drawTime);
	const [numberOfRounds, setNumberOfRounds] = useState(
		DEFAULTS.numberOfRounds,
	);
	const [wordChoicesPerTurn, setWordChoicesPerTurn] = useState(
		DEFAULTS.wordChoicesPerTurn,
	);
	const [timeToChooseWord, setTimeToChooseWord] = useState(
		DEFAULTS.timeToChooseWord,
	);
	const [difficulty, setDifficulty] = useState(DEFAULTS.usingDictionary);
	const [onlyCustomWords, setOnlyCustomWords] = useState(false);
	const [customWords, setCustomWords] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		const parsed = CreateLobbySchema.safeParse({
			mode,
			visibility,
			drawTime,
			numberOfRounds,
			wordChoicesPerTurn,
			timeToChooseWord,
			usingDictionary: onlyCustomWords ? 0 : difficulty,
			customWords,
		} satisfies CreateLobbyDTO);
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Invalid settings");
			return;
		}

		setIsSubmitting(true);
		const res = await createLobby(parsed.data);
		setIsSubmitting(false);
		if (res.ok) navigate(`/lobbies/${res.data.uuid}`);
		else setError(res.error);
	};

	return (
		<div className="p-5 flex justify-center">
			<form
				onSubmit={(e) => void handleSubmit(e)}
				className="form-card"
				noValidate
			>
				<h1 className="form-title">Create a lobby</h1>

				<div className="form-field">
					<span className="form-label">Game mode</span>
					<ToggleButtons
						value={mode}
						options={["SOLO", "DUO"] as const}
						onChange={setMode}
					/>
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
					id="draw-time"
					label="Draw time"
					suffix="s"
					value={drawTime}
					options={DRAW_TIME}
					onChange={setDrawTime}
				/>
				<LobbyOptionSelect
					id="rounds"
					label="Number of rounds"
					value={numberOfRounds}
					options={NB_ROUNDS}
					onChange={setNumberOfRounds}
				/>
				<LobbyOptionSelect
					id="word-choices"
					label="Words per turn"
					value={wordChoicesPerTurn}
					options={WORD_OPTIONS_PER_TURN}
					onChange={setWordChoicesPerTurn}
				/>
				<LobbyOptionSelect
					id="choose-time"
					label="Time to choose a word"
					suffix="s"
					value={timeToChooseWord}
					options={TIME_TO_CHOOSE_WORD}
					onChange={setTimeToChooseWord}
				/>

				<div className="form-field">
					<label htmlFor="difficulty" className="form-label">
						Difficulty
					</label>
					<select
						id="difficulty"
						className="form-input"
						value={difficulty}
						disabled={onlyCustomWords}
						onChange={(e) => setDifficulty(Number(e.target.value))}
					>
						{DIFFICULTIES.map(({ value, label }) => (
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
								setOnlyCustomWords(e.target.checked)
							}
						/>
						Only custom words
					</label>
				</div>

				<div className="form-field">
					<label htmlFor="custom-words" className="form-label">
						Custom words
					</label>
					<textarea
						id="custom-words"
						className="form-input"
						rows={3}
						value={customWords}
						onChange={(e) => setCustomWords(e.target.value)}
					/>
					<p className="text-xs text-gray-500">
						enter max {MAX_CUSTOM_WORDS} words separated by a space
					</p>
				</div>

				{error && <p className="form-alert-error">{error}</p>}

				<button
					type="submit"
					disabled={isSubmitting}
					className="btn-primary"
				>
					{isSubmitting ? "Creating..." : "Create lobby"}
				</button>
			</form>
		</div>
	);
}
