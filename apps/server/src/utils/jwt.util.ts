import jwt from "jsonwebtoken";
import { readEnv, readSecret } from "./env.util";
import { AppDomainError } from "../errors/domain.errors";

export const JWT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function generateAccessToken(uuid: string): string {
	const jwt_secret = readSecret("jwt_secret") ?? readEnv("JWT_SECRET");
	if (!jwt_secret) throw new AppDomainError("JWT secret is missing");
	const token = jwt.sign({ sub: uuid }, jwt_secret, {
		expiresIn: JWT_MAX_AGE,
	});
	return token;
}

export function validateAccessToken(token: string) {
	const jwt_secret = readSecret("jwt_secret") ?? readEnv("JWT_SECRET");
	if (!jwt_secret) throw new AppDomainError("JWT secret is missing");
	const payload = jwt.verify(token, jwt_secret);
	return payload;
}
