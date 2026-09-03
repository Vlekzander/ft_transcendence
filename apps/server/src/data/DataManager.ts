import { GameHistoryEntry, RegisterUserDTO } from "@ft_transcendence/shared";
import { PrismaDataManager } from "./PrismaDataManager";
import { UpdateUserInput, UserEntity } from "./User.data";

export interface DataManager {
	createUser(data: RegisterUserDTO): Promise<UserEntity>;
	getUserById(id: string): Promise<UserEntity | null>;
	getUserByEmail(email: string): Promise<UserEntity | null>;
	getUserByUsername(username: string): Promise<UserEntity | null>;
	updateUserEmail(id: string, email: string): Promise<UserEntity>;
	updateUserPassword(id: string, password: string): Promise<UserEntity>;
	updateUser(id: string, data: UpdateUserInput): Promise<UserEntity>;
	deleteUser(id: string): Promise<void>;
	validateUserPassword(userId: string, password: string): Promise<boolean>;
	getUserHistory(id: string): Promise<GameHistoryEntry[]>;
}

export class DataManagerSingleton {
	private static instance: DataManager | null = null;

	private constructor() {}

	static getInstance(): DataManager {
		if (!this.instance) this.instance = new PrismaDataManager();
		return this.instance;
	}
}
