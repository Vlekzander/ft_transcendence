import z from "zod";
import { PublicUserSchema } from "./user.schemas";

export const GameModeSchema = z.enum(["SOLO", "DUO"]);
export const VisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);
export const CustomWordsSchema = z.array(z.string());

export type LobbyGameMode = z.infer<typeof GameModeSchema>;
export type LobbyVisibility = z.infer<typeof VisibilitySchema>;

// Settings to be specified
// This is a placeholder
export const LobbySettingsSchema = z.record(
    z.string(),
    z.unknown(),
);

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
    joinCode: z
        .string()
        .regex(/^[A-Z0-9]{6}$/, "Invalid lobby join code"),
    customWords: CustomWordsSchema.optional(),
    host: PublicUserSchema.optional(),
    maxPlayers: z.number().int().min(1),
});

export type LobbyResponseDTO = z.infer<typeof LobbyResponseSchema>;

export const LobbyParamsSchema = z.object({
    uuid: z.uuid("Invalid lobby UUID"),
});

export const JoinLobbySchema = z.object({
    joinCode: z
        .string()
        .regex(/^[A-Z0-9]{6}$/, "Invalid lobby join code"),
});

export const UpdateLobbyCustomWordsSchema = z.object({
    customWords: CustomWordsSchema.optional(),
});