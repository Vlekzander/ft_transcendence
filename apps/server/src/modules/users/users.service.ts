import {
	DuplicateElementError,
	DuplicateEmailError,
	DuplicateUsernameError,
	InvalidIdError,
	UnknownUserIdError,
} from "../../errors";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma.lib";
import { generateHash } from "../../utils/hash.util";
import {
	getPrismaConstraintFields,
	userDtoSelect,
} from "../shared/shared.service";
import { UpdateUserInput, UserEntity } from "./users.mapper";

export class UsersService {
	async updateUser(uuid: string, data: UpdateUserInput): Promise<UserEntity> {
		if (data.password !== undefined)
			data.password = await generateHash(data.password);

		try {
			const result = await prisma.user.update({
				where: { uuid: uuid },
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
				throw error;
			}

			throw error;
		}
	}

	async updateUserAvatarPath(
		uuid: string,
		path: string,
	): Promise<UserEntity> {
		try {
			const result = await prisma.user.update({
				where: { uuid: uuid },
				data: { avatarPath: path },
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
}

export const usersService = new UsersService();
