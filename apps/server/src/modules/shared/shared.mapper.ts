import { PublicUserDTO, UserResponseDTO } from "@ft_transcendence/shared";
import { isUserOnline } from "@/websocket.server";

export type UserEntity = {
	uuid: string;
	email: string;
	username: string;
	avatarPath: string | null;
	createdAt: Date;
};

export function toUserResponseDTO(user: UserEntity): UserResponseDTO {
	return {
		uuid: user.uuid,
		email: user.email,
		username: user.username,
		avatarPath: user.avatarPath,
	};
}

export function toPublicUserDTO(user: UserEntity): PublicUserDTO {
	return {
		uuid: user.uuid,
		username: user.username,
		avatarPath: user.avatarPath,
		online: isUserOnline(user.uuid),
	};
}
