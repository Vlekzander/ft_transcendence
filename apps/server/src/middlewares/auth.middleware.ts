import { NextFunction, Request, Response } from "express";
import { validateAccessToken } from "../utils/jwt.util";
import { AlreadyAuthError, RequireAuthError } from "../errors/auth.errors";

function isAuthenticated(req: Request): boolean {
	const token = req.cookies?.token;

	if (!token) return false;
	try {
		return token && validateAccessToken(token);
	} catch (_) {
		return false;
	}
}

export function requireGuest(req: Request, _res: Response, next: NextFunction) {
	if (isAuthenticated(req)) return next(new AlreadyAuthError());
	return next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
	if (isAuthenticated(req)) return next();
	return next(new RequireAuthError());
}
