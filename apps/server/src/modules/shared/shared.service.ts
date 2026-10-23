import { InvalidIdError, UnknownUserIdError } from "../../errors";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma.lib";
import { compareHash } from "../../utils/hash.util";
import { UserEntity } from "./shared.mapper";

type WithDraverAdapterFields = {
	meta?: {
		driverAdapterError?: {
			cause?: {
				constraint?: {
					fields?: string[];
				};
			};
		};
	};
};

export function getPrismaConstraintFields(
	error: Prisma.PrismaClientKnownRequestError,
): string[] {
	if (error.code !== "P2002") return [];
	const e = error as Prisma.PrismaClientKnownRequestError &
		WithDraverAdapterFields;
	return e.meta?.driverAdapterError?.cause?.constraint?.fields ?? [];
}

export const userDtoSelect = {
	uuid: true,
	email: true,
	username: true,
	avatarPath: true,
	createdAt: true,
} as const;

export class SharedService {
	async getUserById(uuid: string): Promise<UserEntity | null> {
		try {
			const result = await prisma.user.findUnique({
				where: { uuid: uuid },
				select: userDtoSelect,
			});

			return result;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") return null;
			}
			throw error;
		}
	}

	async validateUserPassword(
		uuid: string,
		password: string,
	): Promise<boolean> {
		try {
			const result = await prisma.user.findUnique({
				where: { uuid: uuid },
				select: { password: true },
			});

			if (!result) throw new UnknownUserIdError();
			return await compareHash(password, result.password);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async validateUser(uuid: string): Promise<boolean> {
		try {
			const result = await prisma.user.findUnique({
				where: { uuid: uuid },
				select: { isActive: true },
			});

			if (!result) throw new UnknownUserIdError();
			return result.isActive;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
			}
			throw error;
		}
	}
}

export const sharedService = new SharedService();
