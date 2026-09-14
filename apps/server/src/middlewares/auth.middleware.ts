import { NextFunction, Request, Response } from "express";
import { validateAccessToken } from "../utils/jwt.util";
import {
	AlreadyAuthError,
	CannotEditUserError,
	RequireAuthError,
} from "../errors";

function isAuthenticated(req: Request): boolean {
	const token = req.cookies?.token;

	if (!token) return false;
	try {
		return token && validateAccessToken(token);
	} catch {
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

export function requireUserOwnership(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	const { uuid } = req.params;
	const token = req.cookies?.token;

	if (!token) return false;
	try {
		const payload = validateAccessToken(token);
		if (uuid !== payload.sub) return next(new CannotEditUserError());
		return next();
	} catch {
		return false;
	}
}
