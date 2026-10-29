import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router";
import {
	CreateLobbySchema,
	DRAW_TIME,
	NB_ROUNDS,
	WORD_OPTIONS_PER_TURN,
	type CreateLobbyDTO,
	type LobbyGameMode,
	type LobbyVisibility,
} from "@ft_transcendence/shared";
import { createLobby } from "../services/lobby.service";
import LobbyOptionSelect from "../components/LobbyOptionSelect";
import ToggleButtons from "../components/ToggleButtons";
import WordsFields from "../components/WordsFields";
import ActiveLobbyPrompt from "../components/ActiveLobbyPrompt";
import { useActiveLobbyGuard } from "../hooks/useActiveLobbyGuard";

const DEFAULTS = CreateLobbySchema.parse({});

type CreateLobbyFormProps = {
	onCancel?: () => void;
	className?: string;
};

export default function CreateLobbyForm({
	onCancel,
	className = "",
}: CreateLobbyFormProps) {
	const navigate = useNavigate();
	const guard = useActiveLobbyGuard();

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
	const [dictionary, setDictionary] = useState(DEFAULTS.usingDictionary);
	const [onlyCustomWords, setOnlyCustomWords] = useState(false);
	const [customWords, setCustomWords] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		setError(null);

		const parsed = CreateLobbySchema.safeParse({
			mode,
			visibility,
			drawTime,
			numberOfRounds,
			wordChoicesPerTurn,
			usingDictionary: onlyCustomWords ? 0 : dictionary,
			customWords,
		} satisfies CreateLobbyDTO);
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Invalid settings");
			return;
		}

		await guard.run(async () => {
			setIsSubmitting(true);
			const res = await createLobby(parsed.data);
			setIsSubmitting(false);
			if (res.ok) navigate(`/lobbies/${res.data.uuid}`);
			else setError(res.error);
		});
	};

	return (
		<>
			{guard.isPrompting && (
				<ActiveLobbyPrompt
					error={guard.error}
					isBusy={guard.isBusy}
					onContinue={() => void guard.confirm()}
					onBack={guard.goBack}
				/>
			)}
			<form
				onSubmit={(e) => void handleSubmit(e)}
				className={`form-card ${className}`}
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
				<WordsFields
					idPrefix="words"
					dictionary={dictionary}
					onDictionaryChange={setDictionary}
					onlyCustomWords={onlyCustomWords}
					onOnlyCustomWordsChange={setOnlyCustomWords}
					customWords={customWords}
					onCustomWordsChange={setCustomWords}
				/>

				{error && <p className="form-alert-error">{error}</p>}

				<div className="flex gap-3 justify-end">
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							className="px-5 py-2.5 border border-gray-400 font-semibold text-sm sm:text-base hover:bg-gray-400/10 cursor-pointer"
						>
							Cancel
						</button>
					)}
					<button
						type="submit"
						disabled={isSubmitting}
						className="btn-primary"
					>
						{isSubmitting ? "Creating..." : "Create lobby"}
					</button>
				</div>
			</form>
		</>
	);
}
