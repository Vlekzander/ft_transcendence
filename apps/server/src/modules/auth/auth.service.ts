import { LoginUserDTO, RegisterUserDTO } from "@ft_transcendence/shared";
import { Prisma } from "../../generated/prisma/client";
import { UserEntity } from "./auth.mapper";
import { compareHash, generateHash } from "../../utils/hash.util";
import { prisma } from "../../lib/prisma.lib";
import {
	DuplicateElementError,
	DuplicateEmailError,
	DuplicateUsernameError,
	InvalidCredentialsError,
} from "../../errors";
import {
	getPrismaConstraintFields,
	userDtoSelect,
} from "../shared/shared.service";

export class AuthService {
	async register(data: RegisterUserDTO): Promise<UserEntity> {
		const hashedPassword = await generateHash(data.password);

		try {
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
				if (fields.length) throw new DuplicateElementError(fields[0]);
				throw new DuplicateElementError("Unknown");
			}
			throw error;
		}
	}

	async login(data: LoginUserDTO): Promise<UserEntity> {
		const result = await prisma.user.findUnique({
			where: { username: data.username },
			select: {
				...userDtoSelect,
				password: true,
			},
		});

		if (!result) throw new InvalidCredentialsError();
		const valid = await compareHash(data.password, result.password);
		if (!valid) throw new InvalidCredentialsError();

		const { password: _password, ...rest } = result;
		return rest;
	}
}

export const authService = new AuthService();
