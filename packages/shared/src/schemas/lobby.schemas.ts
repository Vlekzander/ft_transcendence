import z from "zod";
import { PublicUserSchema } from "./user.schemas";

// same enum values as in schema.prisma
export const GameModeSchema = z.enum(["SOLO", "DUO"]);
export const VisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

export type GameModeLobby = z.infer<typeof GameModeSchema>;
export type Visibility = z.infer<typeof VisibilitySchema>;

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
    settings: LobbySettingsSchema.default({}),
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
    settings: LobbySettingsSchema,
    host: PublicUserSchema.optional(),
});

export type LobbyResponseDTO = z.infer<typeof LobbyResponseSchema>;

// UUID used as a parameter in GET/PATCH/DELETE requests
export const LobbyParamsSchema = z.object({
    uuid: z.uuid("Invalid lobby UUID"),
});
