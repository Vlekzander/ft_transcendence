import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma.lib";
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

export async function getUserById(uuid: string): Promise<UserEntity | null> {
	const result = await prisma.user.findUnique({
		where: { uuid: uuid },
		select: userDtoSelect,
	});

	return result;
}

export class SharedService {
	async getUserById(uuid: string): Promise<UserEntity | null> {
		const result = await prisma.user.findUnique({
			where: { uuid: uuid },
			select: userDtoSelect,
		});

		return result;
	}
}

export const sharedService = new SharedService();
