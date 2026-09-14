export {
	type UserEntity,
	toUserResponseDTO,
	toPublicUserDTO,
} from "../shared/shared.mapper";
export {
	type GameHistoryEntry,
	type Stat,
	type Achievement,
	EditUserSchema,
	UserParamsSchema,
	type FriendDTO,
} from "@ft_transcendence/shared";

export interface UpdateUserInput {
	email?: string;
	username?: string;
	password?: string;
}
