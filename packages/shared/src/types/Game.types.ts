import { type PublicUserDTO } from "../schemas/user.schemas";

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
	duration: number;
	participants: GameParticipant[];
};
