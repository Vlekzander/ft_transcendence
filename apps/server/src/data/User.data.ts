import { UserResponseDTO } from "@ft_transcendence/shared";

export type UserEntity = {
	uuid: string;
	email: string;
	username: string;
	avatarUuid: string | null;
	createdAt: Date;
};

export function toUserResponseDTO(user: UserEntity): UserResponseDTO {
	return {
		uuid: user.uuid,
		email: user.email,
		username: user.username,
		avatarUuid: user.avatarUuid,
	};
}
