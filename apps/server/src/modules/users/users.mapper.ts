import {
	FriendshipDTO,
	PendingFriendRequestDTO,
	SentFriendRequestDTO,
} from "@ft_transcendence/shared";
import { UserEntity } from "./users.mapper";
import { toPublicUserDTO } from "../shared/shared.mapper";

export { type UserEntity, toUserResponseDTO } from "../shared/shared.mapper";
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

export type PendingRequestEntity = {
	uuid: string;
	sender: UserEntity;
};

export function toFriendshipDTO(friend: FriendshipEntity): FriendshipDTO {
	return {
		uuid: friend.uuid,
		user: toPublicUserDTO(friend.user),
	};
}

export function toSentFriendRequestDTO(
	sentRequest: SentRequestEntity,
): SentFriendRequestDTO {
	return {
		uuid: sentRequest.uuid,
		receiver: toPublicUserDTO(sentRequest.receiver),
	};
}

export function toPendingFriendRequestDTO(
	pendingRequest: PendingRequestEntity,
): PendingFriendRequestDTO {
	return {
		uuid: pendingRequest.uuid,
		sender: toPublicUserDTO(pendingRequest.sender),
	};
}
