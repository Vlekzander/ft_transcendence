import { Router } from "express";
import { DataManagerSingleton } from "../data/DataManager";
import { generateAccessToken, JWT_MAX_AGE } from "../utils/jwt.util";
import { readEnv } from "../utils/env.util";
import { LoginUserSchema, RegisterUserSchema } from "@ft_transcendence/shared";
import { toUserResponseDTO } from "../data/User.data";
import {
	InvalidCredentialsError,
	ValidationError,
} from "../errors/auth.errors";
import { requireGuest } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.post("/register", requireGuest, async (req, res, next) => {
	try {
		const parsed = RegisterUserSchema.safeParse(req.body);
		if (!parsed.success) {
			const issue = parsed.error.issues[0];
			throw new ValidationError(issue.path[0].toString(), issue.message);
		}
		const user = await DataManagerSingleton.getInstance().createUser(
			parsed.data,
		);
		const dto = toUserResponseDTO(user);
		res.cookie("token", generateAccessToken(dto.uuid), {
			httpOnly: true,
			secure: readEnv("NODE_ENV") === "production",
			sameSite: "strict",
			maxAge: JWT_MAX_AGE,
		});
		res.status(200).json({ data: dto });
	} catch (err) {
		next(err);
	}
});

authRouter.post("/login", requireGuest, async (req, res, next) => {
	try {
		const parsed = LoginUserSchema.safeParse(req.body);
		if (!parsed.success) {
			const issue = parsed.error.issues[0];
			throw new ValidationError(issue.path[0].toString(), issue.message);
		}
		const user = await DataManagerSingleton.getInstance().getUserByUsername(
			parsed.data.username,
		);
		if (!user) throw new InvalidCredentialsError();
		const auth =
			await DataManagerSingleton.getInstance().validateUserPassword(
				user.uuid,
				parsed.data.password,
			);
		if (!auth) throw new InvalidCredentialsError();
		const dto = toUserResponseDTO(user);
		res.cookie("token", generateAccessToken(dto.uuid), {
			httpOnly: true,
			secure: readEnv("NODE_ENV") === "production",
			sameSite: "strict",
			maxAge: JWT_MAX_AGE,
		});
		res.status(200).json({ data: dto });
	} catch (err) {
		next(err);
	}
});

export default authRouter;
