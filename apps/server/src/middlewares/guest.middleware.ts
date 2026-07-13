import { NextFunction, Request, Response } from "express";
import { AlreadyAuthenticatedError } from "../errors/auth.errors";
import { verifyToken } from "../utils/token.util";

export function requireGuest(req: Request, _res: Response, next: NextFunction) {
	const token = req.cookies?.token;
	if (!token) {
		next();
		return;
	}

	try {
		verifyToken(token);
	} catch {
		next();
		return;
	}

	throw new AlreadyAuthenticatedError();
}
