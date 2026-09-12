import { LoginUserSchema, RegisterUserSchema } from "@ft_transcendence/shared";
import { ParsedRequest } from "../../middlewares/validate.middleware";
import { CookieOptions, NextFunction, Request, Response } from "express";
import { readEnv } from "../../utils/env.util";
import {
	generateAccessToken,
	JWT_MAX_AGE,
	validateAccessToken,
} from "../../utils/jwt.util";
import { toUserResponseDTO } from "./auth.mapper";
import { authService } from "./auth.service";
import { sharedService } from "../shared/shared.service";

type AuthBody = typeof RegisterUserSchema | typeof LoginUserSchema;

type AuthRequest<T extends AuthBody = AuthBody> = ParsedRequest<{ body: T }>;

const options: CookieOptions = {
	httpOnly: true,
	secure: readEnv("NODE_ENV") === "production",
	sameSite: "strict",
	maxAge: JWT_MAX_AGE,
};

export async function register(
	req: AuthRequest<typeof RegisterUserSchema>,
	res: Response,
	next: NextFunction,
) {
	try {
		const data = req.parsedBody!;
		const user = await authService.register(data);
		const dto = toUserResponseDTO(user);

		res.cookie("token", generateAccessToken(dto.uuid), options);
		res.status(201).json({ data: dto });
	} catch (err) {
		next(err);
	}
}

export async function login(
	req: AuthRequest<typeof LoginUserSchema>,
	res: Response,
	next: NextFunction,
) {
	try {
		const data = req.parsedBody!;
		const user = await authService.login(data);
		const dto = toUserResponseDTO(user);

		res.cookie("token", generateAccessToken(dto.uuid), options);
		res.status(200).json({ data: dto });
	} catch (err) {
		next(err);
	}
}

export async function logout(_req: Request, res: Response) {
	res.clearCookie("token", options);
	res.sendStatus(204);
}

export async function whoami(req: Request, res: Response, next: NextFunction) {
	try {
		const token = req.cookies?.token;
		if (!token) return res.status(200).json({ authenticated: false });

		const payload = validateAccessToken(token);

		const user = await sharedService.getUserById(payload.sub as string);
		if (!user) return res.status(200).json({ authenticated: false });

		const dto = toUserResponseDTO(user);
		res.status(200).json({ authenticated: true, user: dto });
	} catch (err) {
		next(err);
	}
}
