import { GameHistoryEntry, RegisterUserDTO } from "@ft_transcendence/shared";
import {
	DuplicateElementError,
	DuplicateEmailError,
	DuplicateUsernameError,
	InvalidIdError,
	UnknownUserIdError,
} from "../errors/data-manager.errors";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma.lib";
import { compareHash, generateHash } from "../utils/hash.util";
import { DataManager } from "./DataManager";
import { UpdateUserInput, UserEntity } from "./User.data";

function getPrismaConstraintFields(
	error: Prisma.PrismaClientKnownRequestError,
): string[] {
	if (error.code !== "P2002") return [];
	return error.meta?.driverAdapterError?.cause?.constraint?.fields ?? [];
}

const userDtoSelect = {
	uuid: true,
	email: true,
	username: true,
	avatarPath: true,
	createdAt: true,
} as const;

export class PrismaDataManager implements DataManager {
	async createUser(data: RegisterUserDTO): Promise<UserEntity> {
		try {
			const hashedPassword = await generateHash(data.password);
			const result = await prisma.user.create({
				data: {
					email: data.email,
					username: data.username,
					password: hashedPassword,
				},
				select: userDtoSelect,
			});

			return result;
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

	async getUserById(id: string): Promise<UserEntity | null> {
		try {
			const result = await prisma.user.findUnique({
				where: { uuid: id },
				select: userDtoSelect,
			});

			if (!result) return null;
			return result;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") return null;
			}
			throw error;
		}
	}

	async getUserByEmail(email: string): Promise<UserEntity | null> {
		const result = await prisma.user.findUnique({
			where: { email: email },
			select: userDtoSelect,
		});

		if (!result) return null;
		return result;
	}

	async getUserByUsername(username: string): Promise<UserEntity | null> {
		const result = await prisma.user.findUnique({
			where: { username: username },
			select: userDtoSelect,
		});

		if (!result) return null;
		return result;
	}

	async updateUserEmail(id: string, email: string): Promise<UserEntity> {
		try {
			const result = await prisma.user.update({
				where: { uuid: id },
				data: { email: email },
				select: userDtoSelect,
			});

			return result;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async updateUserPassword(
		id: string,
		password: string,
	): Promise<UserEntity> {
		const hashedPassword = await generateHash(password);
		try {
			const result = await prisma.user.update({
				where: { uuid: id },
				data: { password: hashedPassword },
				select: userDtoSelect,
			});

			return result;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async updateUser(id: string, data: UpdateUserInput): Promise<UserEntity> {
		if (data.password !== undefined)
			data.password = await generateHash(data.password);

		try {
			const result = await prisma.user.update({
				where: { uuid: id },
				data: data,
				select: userDtoSelect,
			});

			return result;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
				if (error.code === "P2002") {
					const fields = getPrismaConstraintFields(error);
					if (fields.includes("email"))
						throw new DuplicateEmailError();
					if (fields.includes("username"))
						throw new DuplicateUsernameError();
					if (fields) throw new DuplicateElementError(fields[0]);
					throw new DuplicateElementError("Unknown");
				}
			}
			throw error;
		}
	}

	async deleteUser(id: string): Promise<void> {
		try {
			await prisma.user.delete({ where: { uuid: id } });
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
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
				select: { password: true },
			});

			if (!result) throw new UnknownUserIdError();

			return await compareHash(password, result?.password);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async getUserHistory(id: string): Promise<GameHistoryEntry[]> {
		try {
			const result = await prisma.userOnGame.findMany({
				where: { userId: id },
				orderBy: {
					gameId: "desc",
				},
				include: {
					game: {
						include: {
							participants: {
								select: {
									userId: true,
									score: true,
									user: {
										select: {
											uuid: true,
											username: true,
											avatarPath: true,
										},
									},
								},
							},
						},
					},
				},
			});

			const history: GameHistoryEntry[] = result
				.filter((game) => game.game.finished)
				.map((game) => ({
					uuid: game.game.uuid,
					mode: game.game.mode,
					finished: game.game.finished,
					duration: game.game.duration,
					participants: game.game.participants.map((p) => ({
						userId: p.userId,
						score: p.score ?? 0,
						user: {
							uuid: p.user.uuid,
							username: p.user.username,
							avatarPath: p.user.avatarPath,
						},
					})),
				}));

			return history;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
			}
			throw error;
		}
	}
}
