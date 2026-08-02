import { CreateUserDTO } from "@ft_transcendence/shared";
import { PrismaDataManager } from "./PrismaDataManager";
import { UserEntity } from "./User.data";

export type AvatarDTO = {
	uuid: string;
	path: string;
};

export interface DataManager {
	createUser(data: CreateUserDTO): Promise<UserEntity>;
	createAvatar(path: string): Promise<AvatarDTO>;
	getUserById(id: string): Promise<UserEntity | null>;
	getUserByEmail(email: string): Promise<UserEntity | null>;
	getUserByUsername(username: string): Promise<UserEntity | null>;
	getAvatarById(id: string): Promise<AvatarDTO | null>;
	updateUserEmail(id: string, email: string): Promise<UserEntity>;
	updateUserPassword(id: string, password: string): Promise<UserEntity>;
	updateUserAvatar(id: string, avatarId: string): Promise<UserEntity>;
	deleteUser(id: string): Promise<void>;
	deleteAvatar(id: string): Promise<void>;

	validateUserPassword(userId: string, password: string): Promise<boolean>;
}

export class DataManagerSingleton {
	private static instance: DataManager | null = null;

	private constructor() {}

	static getInstance(): DataManager {
		if (!this.instance) this.instance = new PrismaDataManager();
		return this.instance;
	}
}
