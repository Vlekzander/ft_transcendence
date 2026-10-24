import jwt from "jsonwebtoken";
import { readEnv, readSecret } from "./env.util";
import { AppDomainError } from "@ft_transcendence/shared";
import { InvalidIdError, InvalidJWTError } from "@/errors";
import z from "zod";

export const JWT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const jwtPayloadSchema = z.object({
	sub: z.uuid(),
});

export function generateAccessToken(uuid: string): string {
	const validatedUuid = z.uuid().safeParse(uuid);
	if (!validatedUuid.success) throw new InvalidIdError();

	const jwt_secret = readSecret("jwt_secret") ?? readEnv("JWT_SECRET");
	if (!jwt_secret) throw new AppDomainError("JWT secret is missing");

	const token = jwt.sign({ sub: validatedUuid.data }, jwt_secret, {
		expiresIn: JWT_MAX_AGE,
	});
	return token;
}

export function validateAccessToken(token: string) {
	const jwt_secret = readSecret("jwt_secret") ?? readEnv("JWT_SECRET");
	if (!jwt_secret) throw new AppDomainError("JWT secret is missing");

	try {
		const rawPayload = jwt.verify(token, jwt_secret);
		const payload = jwtPayloadSchema.parse(rawPayload);
		return payload;
	} catch {
		throw new InvalidJWTError();
	}
}
