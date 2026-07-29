import {
	DuplicateElementError,
	DuplicateEmailError,
	DuplicateUsernameError,
} from "../errors/data-manager.errors";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma.lib";
import { generateHash } from "../utils/hash.util";
import {
	AvatarDTO,
	CreateUserInput,
	DataManager,
	UserDTO,
} from "./DataManager";

function getPrismaConstraintFields(
	error: Prisma.PrismaClientKnownRequestError,
): string[] {
	if (error.code !== "P2002") return [];
	return error.meta?.driverAdapterError?.cause?.constraint?.fields ?? [];
}

export class PrismaDataManager implements DataManager {
	async createUser(data: CreateUserInput): Promise<UserDTO> {
		try {
			const hashedPassword = await generateHash(data.password);
			const result = await prisma.user.create({
				data: {
					email: data.email,
					username: data.username,
					password: hashedPassword,
				},
			});

			return {
				uuid: result.uuid,
				email: result.email,
				username: result.username,
				avatarUuid: result.avatarUuid,
				createdAt: result.createdAt,
			};
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				const fields = getPrismaConstraintFields(error);
				if (fields.includes("email")) throw new DuplicateEmailError();
				if (fields.includes("username"))
					throw new DuplicateUsernameError();
				if (fields) throw new DuplicateElementError(fields[0]);
				throw new DuplicateElementError("Unknown");
			}
			throw error;
		}
	}

	async createAvatar(path: string): Promise<AvatarDTO> {
		const result = await prisma.avatar.create({
			data: {
				path: path,
			},
		});

		return {
			uuid: result.uuid,
			path: result.path,
		};
	}

	async getUserById(_id: string): Promise<UserDTO | null> {
		throw new Error("Not implemented");
	}

	async getUserByEmail(_email: string): Promise<UserDTO | null> {
		throw new Error("Not implemented");
	}

	async getUserByUsername(_username: string): Promise<UserDTO | null> {
		throw new Error("Not implemented");
	}

	async getAvatarById(_id: string): Promise<AvatarDTO | null> {
		throw new Error("Not implemented");
	}

	async updateUserEmail(_id: string, _email: string): Promise<UserDTO> {
		throw new Error("Not implemented");
	}

	async updateUserPassword(_id: string, _password: string): Promise<UserDTO> {
		throw new Error("Not implemented");
	}

	async updateUserAvatar(_id: string, _avatarId: string): Promise<UserDTO> {
		throw new Error("Not implemented");
	}

	async deleteUser(_id: string): Promise<void> {
		throw new Error("Not implemented");
	}

	async deleteAvatar(_id: string): Promise<void> {
		throw new Error("Not implemented");
	}

	async validateUserPassword(
		_userId: string,
		_password: string,
	): Promise<boolean> {
		throw new Error("Not implemented");
	}
}
