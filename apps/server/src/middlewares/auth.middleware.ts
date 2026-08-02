import { NextFunction, Request, Response } from "express";
import { validateAccessToken } from "../utils/jwt.util";
import { AlreadyAuthError } from "../errors/auth.errors";

export function requireGuest(req: Request, _res: Response, next: NextFunction) {
	const token = req.cookies?.token;

	if (token && validateAccessToken(token))
		return next(new AlreadyAuthError());
	return next();
}
