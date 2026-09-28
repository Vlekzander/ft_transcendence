<<<<<<< HEAD
<<<<<<< HEAD
import { PublicUserDTO, UserResponseDTO } from "@ft_transcendence/shared";
import { isUserOnline } from "@/websocket.server";
=======
import { PublicUserDTO, UserResponseDTO, LobbyResponseDTO } from "@ft_transcendence/shared";
>>>>>>> 853206e (Added Lobby model to prisma. Created validation scheme. Started creating Lobby module (controller, route, services, mapper). Added uuidv7 dependency.)
=======
import { PublicUserDTO, UserResponseDTO } from "@ft_transcendence/shared";
>>>>>>> 94bb6aa (cleaned up incoherent code for lobby part. added Lobby array as component of a user in prisma scheme. For the moment, Lobbies are store on server memory, not saved in DB.)

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

