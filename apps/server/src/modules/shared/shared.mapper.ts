<<<<<<< HEAD
import { PublicUserDTO, UserResponseDTO } from "@ft_transcendence/shared";
import { isUserOnline } from "@/websocket.server";
=======
import { PublicUserDTO, UserResponseDTO, LobbyResponseDTO } from "@ft_transcendence/shared";
>>>>>>> 853206e (Added Lobby model to prisma. Created validation scheme. Started creating Lobby module (controller, route, services, mapper). Added uuidv7 dependency.)

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

export type LobbyEntity = {
	uuid: string;
	joinCode: string;
	hostId: string;
	mode: string;
	visibility: string;
	settings: Record<string, unknown>;
	createdAt: Date;
};

export function toLobbyResponseDTO(lobby: LobbyEntity): LobbyResponseDTO {
	return {
		uuid: lobby.uuid,
		joinCode: lobby.joinCode,
		hostId: lobby.hostId,
		mode: lobby.mode,
		visibility: lobby.visibility,
		settings: lobby.settings,
		createdAt: lobby.createdAt,
	};
}