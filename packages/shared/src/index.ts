export * from "./errors/domain.errors";
export * from "./errors/validation.errors";
export * from "./schemas/lobby.schemas";
export * from "./schemas/user.schemas";

export * from "./types/Achievement.types";
export * from "./types/Game.types";
export * from "./types/Msg.types";
export * from "./types/Stat.types";
export * from "./types/Status.types";
export * from "./types/User.types";
export * from "./types/WebSocket.types";

export const hello = (name: string) => `Hello ${name}`;
