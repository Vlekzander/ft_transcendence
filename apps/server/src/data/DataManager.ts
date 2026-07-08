export enum UserRole {
	USER,
	MODERATOR,
	ADMINISTRATOR,
}

export type CreateUserInput = {
	email: string;
	username: string;
	password: string;
};

export type UserDTO = {
	uuid: string;
	email: string;
	username: string;
	role: UserRole;
	banned: boolean;
	avatarUuid: string | null;
	createdAt: Date;
};

export type AvatarDTO = {
	uuid: string;
	path: string;
};

export interface DataManager {
	createUser(data: CreateUserInput): Promise<UserDTO>;
	createAvatar(path: string): Promise<AvatarDTO>;
	getUserById(id: string): Promise<UserDTO | null>;
	getUserByEmail(email: string): Promise<UserDTO | null>;
	getUserByUsername(username: string): Promise<UserDTO | null>;
	getAvatarById(id: string): Promise<AvatarDTO | null>;
	updateUserEmail(id: string, email: string): Promise<UserDTO>;
	updateUserPassword(id: string, password: string): Promise<UserDTO>;
	updateUserAvatar(id: string, avatarId: string): Promise<UserDTO>;
	deleteUser(id: string): Promise<void>;
	deleteAvatar(id: string): Promise<void>;

	validateUserPassword(userId: string, password: string): Promise<boolean>;
}
