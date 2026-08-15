import { PublicUserDTO } from "./User.types";

export type GameMode = "SOLO" | "DUO";

export type GameParticipant = {
	userId: string;
	score: number;
	user: PublicUserDTO;
};

export type GameHistoryEntry = {
	uuid: string;
	mode: GameMode;
	finished: boolean;
	participants: GameParticipant[];
};
