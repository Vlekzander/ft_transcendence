import { compareHash, generateHash } from "../utils/hash.util";
import {
	UserRole,
	CreateUserInput,
	UserDTO,
	AvatarDTO,
	DataManager,
} from "./DataManager";

export class MockDataManager implements DataManager {
	private avatars = new Map<string, AvatarDTO>();
	private users = new Map<string, UserDTO & { passwordHash: string }>();

	async createUser(data: CreateUserInput): Promise<UserDTO> {
		for (const user of this.users.values()) {
			if (user.email === data.email)
				throw new Error("Email already used");
			if (user.username === data.username)
				throw new Error("Username already used");
		}
		const now = new Date();
		const hashedPassword = await generateHash(data.password);
		const user: UserDTO & { passwordHash: string } = {
			uuid: crypto.randomUUID(),
			email: data.email,
			username: data.username,
			passwordHash: hashedPassword,
			role: UserRole.USER,
			banned: false,
			avatarUuid: null,
			createdAt: now,
		};
		this.users.set(user.uuid, user);
		const { passwordHash: _passwordHash, ...dto } = user;
		return dto;
	}

	async createAvatar(path: string): Promise<AvatarDTO> {
		const avatar: AvatarDTO = {
			uuid: crypto.randomUUID(),
			path,
		};
		this.avatars.set(avatar.uuid, avatar);
		return avatar;
	}

	async getUserById(id: string): Promise<UserDTO | null> {
		const user = this.users.get(id);
		if (!user) return null;
		const { passwordHash: _passwordHash, ...dto } = user;
		return dto;
	}

	async getUserByEmail(email: string): Promise<UserDTO | null> {
		for (const user of this.users.values()) {
			if (user.email === email) {
				const { passwordHash: _passwordHash, ...dto } = user;
				return dto;
			}
		}
		return null;
	}

	async getUserByUsername(username: string): Promise<UserDTO | null> {
		for (const user of this.users.values()) {
			if (user.username === username) {
				const { passwordHash: _passwordHash, ...dto } = user;
				return dto;
			}
		}
		return null;
	}

	async getAvatarById(id: string): Promise<AvatarDTO | null> {
		const avatar = this.avatars.get(id);
		if (!avatar) return null;
		return avatar;
	}

	async updateUserEmail(id: string, email: string): Promise<UserDTO> {
		const user = this.users.get(id);
		if (user == null) throw new Error("Invalid user id");
		user.email = email;
		return user;
	}

	async updateUserPassword(id: string, password: string): Promise<UserDTO> {
		const user = this.users.get(id);
		if (user == null) throw new Error("Invalid user id");
		user.passwordHash = await generateHash(password);
		return user;
	}

	async updateUserAvatar(id: string, avatarId: string): Promise<UserDTO> {
		const user = this.users.get(id);
		if (user == null) throw new Error("Invalid user id");
		user.avatarUuid = avatarId;
		return user;
	}

	async deleteUser(id: string): Promise<void> {
		const user = this.users.get(id);
		if (user == null) throw new Error("Invalid user id");
		this.users.delete(id);
	}

	async deleteAvatar(id: string): Promise<void> {
		const user = this.avatars.get(id);
		if (user == null) throw new Error("Invalid avatar id");
		this.avatars.delete(id);
	}

	async validateUserPassword(
		userId: string,
		password: string,
	): Promise<boolean> {
		const user = this.users.get(userId);
		if (!user) throw new Error("Invalid user id");
		return compareHash(password, user.passwordHash);
	}
}
