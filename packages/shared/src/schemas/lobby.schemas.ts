import z from "zod";

export const regexWithSpacesAndHyphens = /^[\p{L}\s-]+$/u;

// CONSTANTS
export const MAX_CUSTOM_WORDS = 100;
export const MAX_PLAYERS = 10;

const NB_ROUNDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const WORD_OPTIONS_PER_TURN = [1, 2, 3, 4, 5];
const TIME_TO_CHOOSE_WORD = [5, 10, 15, 20, 25];
const DRAW_TIME = [15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 180, 240];

// SCHEMA DEFINITIONS
const GameModeSchema = z.enum(["SOLO", "DUO"]);
const VisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);
const CustomWordsSchema = z
	.string()
	.toLowerCase()
	.trim()
	.refine(
		(value) => {
			if (value.length === 0) return true;

			const words = Array.from(
				new Set(value.split(/\s+/).filter(Boolean)),
			);
			return (
				words.length <= MAX_CUSTOM_WORDS &&
				regexWithSpacesAndHyphens.test(value)
			);
		},
		{
			message: "Invalid or too many custom words",
		},
	);

const DrawTimeSchema = z.int().refine((value) => DRAW_TIME.includes(value), {
	message: "Invalid draw time",
});
const NumberOfRoundsSchema = z
	.int()
	.refine((value) => NB_ROUNDS.includes(value), {
		message: "Invalid number of rounds",
	});
const WordChoicesPerTurnSchema = z
	.int()
	.refine((value) => WORD_OPTIONS_PER_TURN.includes(value), {
		message: "Invalid number of word choices per turn",
	});
const TimeToChooseWordSchema = z
	.int()
	.refine((value) => TIME_TO_CHOOSE_WORD.includes(value), {
		message: "Invalid time to choose word",
	});
const UsingDictionarySchema = z.int().min(0).max(2);
const JoinCodeSchema = z
	.string()
	.regex(/^[A-Z0-9]{6}$/, "Invalid lobby join code");

export type LobbyGameMode = z.infer<typeof GameModeSchema>;
export type LobbyVisibility = z.infer<typeof VisibilitySchema>;

// COMPOSITE SCHEMAS
export const CreateLobbySchema = z
	.object({
		mode: GameModeSchema.default("SOLO"),
		visibility: VisibilitySchema.default("PUBLIC"),
		usingDictionary: UsingDictionarySchema.default(1),
		customWords: CustomWordsSchema.default(""),
		drawTime: DrawTimeSchema.default(DRAW_TIME[DRAW_TIME.length / 2]),
		numberOfRounds: NumberOfRoundsSchema.default(
			NB_ROUNDS[NB_ROUNDS.length / 2],
		),
		wordChoicesPerTurn: WordChoicesPerTurnSchema.default(
			WORD_OPTIONS_PER_TURN[WORD_OPTIONS_PER_TURN.length / 2],
		),
		timeToChooseWord: TimeToChooseWordSchema.default(
			TIME_TO_CHOOSE_WORD[TIME_TO_CHOOSE_WORD.length / 2],
		),
	})
	.refine(
		(data) =>
			data.usingDictionary !== 0 ||
			(regexWithSpacesAndHyphens.test(data.customWords.trim()) &&
				data.customWords.trim().length > 0),
		{
			message: "At least one custom word is required",
			path: ["customWords"],
		},
	);

export type CreateLobbyDTO = z.infer<typeof CreateLobbySchema>;

// response sent by the API
export const LobbyResponseSchema = z.object({
	uuid: z.uuid(),
	hostId: z.uuid(),
	mode: GameModeSchema,
	visibility: VisibilitySchema,
	joinCode: JoinCodeSchema,
	maxPlayers: z.int().min(1).max(MAX_PLAYERS),
	connectedPlayers: z.array(z.uuid()),
	bannedPlayers: z.array(z.uuid()),
	usingDictionary: UsingDictionarySchema,
	drawTime: DrawTimeSchema,
	numberOfRounds: NumberOfRoundsSchema,
	wordChoicesPerTurn: WordChoicesPerTurnSchema,
	timeToChooseWord: TimeToChooseWordSchema,
	allWords: z.array(z.string()),
});

export type LobbyResponseDTO = z.infer<typeof LobbyResponseSchema>;

export const LobbyParamsSchema = z.object({
	uuid: z.uuid("Invalid lobby UUID"),
});

export const JoinLobbySchema = z.object({
	joinCode: JoinCodeSchema,
});

export const UpdateLobbySchema = z.object({
	visibility: VisibilitySchema,
	numberOfRounds: NumberOfRoundsSchema,
	wordChoicesPerTurn: WordChoicesPerTurnSchema,
	timeToChooseWord: TimeToChooseWordSchema,
	drawTime: DrawTimeSchema,
});

export type UpdateLobbyDTO = z.infer<typeof UpdateLobbySchema>;

export const LobbyPlayerBodySchema = z.object({
	userId: z.uuid(),
});
