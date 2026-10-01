import z from "zod";

// CONSTANTS
const MAX_WORD_LENGTH = 50;
const MAX_CUSTOM_WORDS = 100;

const MIN_DRAW_TIME = 10;
const DEFAULT_DRAW_TIME = 120;
const DEFAULT_NUMBER_OF_ROUNDS = 5;
const DEFAULT_NB_WORD_CHOICES_PER_TURN = 3;
const MIN_TIME_TO_CHOOSE_WORD = 5;
const DEFAULT_TIME_TO_CHOOSE_WORD = 15;

const MAX_NB_WORD_CHOICES_PER_TURN = 5;

// SCHEMA DEFINITIONS
const GameModeSchema = z.enum(["SOLO", "DUO"]).default("SOLO");
const VisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC");
const CustomWordsSchema = z
	.array(z.string().trim().min(1).max(MAX_WORD_LENGTH))
	.max(MAX_CUSTOM_WORDS)
	.default([]);
const DrawTimeSchema = z.int().min(MIN_DRAW_TIME).default(DEFAULT_DRAW_TIME);
const NumberOfRoundsSchema = z.int().min(1).default(DEFAULT_NUMBER_OF_ROUNDS);
const WordChoicesPerTurnSchema = z
	.int()
	.min(1)
	.max(MAX_NB_WORD_CHOICES_PER_TURN)
	.default(DEFAULT_NB_WORD_CHOICES_PER_TURN);
const TimeToChooseWordSchema = z
	.int()
	.min(MIN_TIME_TO_CHOOSE_WORD)
	.default(DEFAULT_TIME_TO_CHOOSE_WORD);
const UsingDictionarySchema = z.int().min(0).default(1);

export type LobbyGameMode = z.infer<typeof GameModeSchema>;
export type LobbyVisibility = z.infer<typeof VisibilitySchema>;

// COMPOSITE SCHEMAS
export const CreateLobbySchema = z.object({
	mode: GameModeSchema,
	visibility: VisibilitySchema,
	usingDictionary: UsingDictionarySchema,
	customWords: CustomWordsSchema,
	drawTime: DrawTimeSchema,
	numberOfRounds: NumberOfRoundsSchema,
	wordChoicesPerTurn: WordChoicesPerTurnSchema,
	timeToChooseWord: TimeToChooseWordSchema,
});

export type CreateLobbyDTO = z.infer<typeof CreateLobbySchema>;

// response sent by the API
export const LobbyResponseSchema = z.object({
	uuid: z.uuid(),
	hostId: z.uuid(),
	mode: GameModeSchema,
	visibility: VisibilitySchema,
	joinCode: z.string().regex(/^[A-Z0-9]{6}$/, "Invalid lobby join code"),
	customWords: CustomWordsSchema.default([]),
	maxPlayers: z.int().min(1),
	connectedPlayers: z.array(z.uuid()),
});

export type LobbyResponseDTO = z.infer<typeof LobbyResponseSchema>;

export const LobbyParamsSchema = z.object({
	uuid: z.uuid("Invalid lobby UUID"),
});

export const JoinLobbySchema = z.object({
	joinCode: z.string().regex(/^[A-Z0-9]{6}$/, "Invalid lobby join code"),
});

export const UpdateLobbyCustomWordsSchema = z.object({
	// other settings top add and thus change controller and service name
	customWords: CustomWordsSchema.optional(),
});
