import jwt from "jsonwebtoken";
import { UserRole } from "../data/DataManager";

if (!process.env.JWT_SECRET) {
	throw new Error("JWT_SECRET environment variable is not set");
}

const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

export type TokenPayload = {
	sub: string;
	role: UserRole;
};

export function generateToken(payload: TokenPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
	return jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
}
