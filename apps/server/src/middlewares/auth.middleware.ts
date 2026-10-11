import { NextFunction, Request, Response } from "express";
import { validateAccessToken } from "../utils/jwt.util";
import {
	AlreadyAuthError,
	CannotEditUserError,
	RequireAuthError,
} from "../errors";

export function getTokenUuid(req: Request): string | undefined {
	const token = req.cookies?.token;

	if (!token) return undefined;
	try {
		const payload = validateAccessToken(token);
		return payload.sub?.toString();
	} catch {
		return undefined;
	}
}

function isAuthenticated(req: Request): boolean {
	const uuid = getTokenUuid(req);

	if (!uuid) return false;
	return true;
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

	if (!token) return next(new RequireAuthError());
	try {
		const payload = validateAccessToken(token);
		if (uuid !== payload.sub) return next(new CannotEditUserError());
		return next();
	} catch {
		return next(new RequireAuthError());
	}
}
