import z from "zod";

const MAX_WORD_LENGTH = 50;
const MAX_CUSTOM_WORDS = 100;

export const GameModeSchema = z.enum(["SOLO", "DUO"]);
export const VisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);
export const CustomWordsSchema = z
	.array(z.string().trim().min(1).max(MAX_WORD_LENGTH))
	.max(MAX_CUSTOM_WORDS)
	.default([]);

export type LobbyGameMode = z.infer<typeof GameModeSchema>;
export type LobbyVisibility = z.infer<typeof VisibilitySchema>;

// create a lobby
export const CreateLobbySchema = z.object({
	mode: GameModeSchema.default("SOLO"),
	visibility: VisibilitySchema.default("PUBLIC"),
	customWords: CustomWordsSchema,
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
	maxPlayers: z.number().int().min(1),
	players: z.array(z.uuid()),
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
