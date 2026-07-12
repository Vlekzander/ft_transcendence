import { NextFunction, Request, Response } from "express";
import { TokenPayload, verifyToken } from "../utils/token.util";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace -- required to augment Express's Request type
	namespace Express {
		interface Request {
			user?: TokenPayload;
		}
	}
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const token = req.cookies?.token;
	if (!token) {
		res.status(401).json({ message: "Authentication required" });
		return;
	}

	try {
		req.user = verifyToken(token);
		next();
	} catch {
		res.status(401).json({ message: "Authentication required" });
	}
}
