import { NextFunction, Request, Response } from "express";
import { UnauthenticatedError } from "../errors/auth.errors";
import { verifyToken } from "../utils/token.util";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
	const token = req.cookies?.token;
	if (!token) {
		throw new UnauthenticatedError();
	}

	try {
		req.user = verifyToken(token);
	} catch {
		throw new UnauthenticatedError();
	}
	next();
}
