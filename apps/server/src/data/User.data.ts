import { UserResponseDTO } from "@ft_transcendence/shared";

export type UserEntity = {
	uuid: string;
	email: string;
	username: string;
	avatarPath: string | null;
	createdAt: Date;
};

export interface UpdateUserInput {
	email?: string;
	username?: string;
	password?: string;
}

export function toUserResponseDTO(user: UserEntity): UserResponseDTO {
	return {
		uuid: user.uuid,
		email: user.email,
		username: user.username,
		avatarPath: user.avatarPath,
	};
}
