import { CookieOptions, Router } from "express";
import { DataManagerSingleton } from "../data/DataManager";
import { generateAccessToken, JWT_MAX_AGE } from "../utils/jwt.util";
import { readEnv } from "../utils/env.util";
import { parseLoginUser, parseRegisterUser } from "@ft_transcendence/shared";
import { toUserResponseDTO } from "../data/User.data";
import { InvalidCredentialsError } from "../errors/auth.errors";
import { requireAuth, requireGuest } from "../middlewares/auth.middleware";

const authRouter = Router();

const options: CookieOptions = {
	httpOnly: true,
	secure: readEnv("NODE_ENV") === "production",
	sameSite: "strict",
	maxAge: JWT_MAX_AGE,
};

authRouter.post("/register", requireGuest, async (req, res, next) => {
	try {
		const data = parseRegisterUser(req.body);
		const user = await DataManagerSingleton.getInstance().createUser(data);
		const dto = toUserResponseDTO(user);
		res.cookie("token", generateAccessToken(dto.uuid), options);
		res.status(201).json({ data: dto });
	} catch (err) {
		next(err);
	}
});

authRouter.post("/login", requireGuest, async (req, res, next) => {
	try {
		const data = parseLoginUser(req.body);
		const user = await DataManagerSingleton.getInstance().getUserByUsername(
			data.username,
		);
		if (!user) throw new InvalidCredentialsError();
		const validation =
			await DataManagerSingleton.getInstance().validateUserPassword(
				user.uuid,
				data.password,
			);
		if (!validation) throw new InvalidCredentialsError();
		const dto = toUserResponseDTO(user);
		res.cookie("token", generateAccessToken(dto.uuid), options);
		res.status(200).json({ data: dto });
	} catch (err) {
		next(err);
	}
});

authRouter.post("/logout", requireAuth, async (_req, res, next) => {
	try {
		res.clearCookie("token", { path: "/" });
		res.sendStatus(204);
	} catch (err) {
		next(err);
	}
});

export default authRouter;
