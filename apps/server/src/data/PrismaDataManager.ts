import {
	DuplicateElementError,
	DuplicateEmailError,
	DuplicateUsernameError,
	UnknownAvatarIdError,
	UnknownUserIdError,
} from "../errors/data-manager.errors";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma.lib";
import { compareHash, generateHash } from "../utils/hash.util";
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

	async getUserById(id: string): Promise<UserDTO | null> {
		try {
			const result = await prisma.user.findUnique({
				where: { uuid: id },
			});

			if (!result) return null;
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
				error.code === "P2007"
			) {
				return null;
			}
			throw error;
		}
	}

	async getUserByEmail(email: string): Promise<UserDTO | null> {
		const result = await prisma.user.findUnique({
			where: { email: email },
		});

		if (!result) return null;
		return {
			uuid: result.uuid,
			email: result.email,
			username: result.username,
			avatarUuid: result.avatarUuid,
			createdAt: result.createdAt,
		};
	}

	async getUserByUsername(username: string): Promise<UserDTO | null> {
		const result = await prisma.user.findUnique({
			where: { username: username },
		});

		if (!result) return null;
		return {
			uuid: result.uuid,
			email: result.email,
			username: result.username,
			avatarUuid: result.avatarUuid,
			createdAt: result.createdAt,
		};
	}

	async getAvatarById(id: string): Promise<AvatarDTO | null> {
		try {
			const result = await prisma.avatar.findUnique({
				where: { uuid: id },
			});

			if (!result) return null;
			return {
				uuid: result.uuid,
				path: result.path,
			};
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2007"
			) {
				return null;
			}
			throw error;
		}
	}

	async updateUserEmail(id: string, email: string): Promise<UserDTO> {
		try {
			const result = await prisma.user.update({
				where: { uuid: id },
				data: { email: email },
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
				(error.code === "P2007" || error.code === "P2025")
			) {
				throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async updateUserPassword(id: string, password: string): Promise<UserDTO> {
		const hashedPassword = await generateHash(password);
		try {
			const result = await prisma.user.update({
				where: { uuid: id },
				data: { password: hashedPassword },
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
				(error.code === "P2007" || error.code === "P2025")
			) {
				throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async updateUserAvatar(id: string, avatarId: string): Promise<UserDTO> {
		try {
			const result = await prisma.user.update({
				where: { uuid: id },
				data: { avatar: { connect: { uuid: avatarId } } },
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
				(error.code === "P2007" || error.code === "P2025")
			) {
				throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async deleteUser(id: string): Promise<void> {
		try {
			await prisma.user.delete({ where: { uuid: id } });
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				(error.code === "P2007" || error.code === "P2025")
			) {
				throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async deleteAvatar(id: string): Promise<void> {
		try {
			await prisma.avatar.delete({ where: { uuid: id } });
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				(error.code === "P2007" || error.code === "P2025")
			) {
				throw new UnknownAvatarIdError();
			}
			throw error;
		}
	}

	async validateUserPassword(
		userId: string,
		password: string,
	): Promise<boolean> {
		try {
			const result = await prisma.user.findUnique({
				where: { uuid: userId },
			});

			if (!result) throw new UnknownUserIdError();

			return await compareHash(password, result?.password);
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				(error.code === "P2007" || error.code === "P2025")
			) {
				throw new UnknownUserIdError();
			}
			throw error;
		}
	}
}
