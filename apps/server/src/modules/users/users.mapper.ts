import { UserEntity } from "./users.mapper";

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

export type FriendshipEntity = {
	uuid: string;
	user: UserEntity;
};

export type SentRequestEntity = {
	uuid: string;
	receiver: UserEntity;
};

export type ReceivedRequestEntity = {
	uuid: string;
	sender: UserEntity;
};
