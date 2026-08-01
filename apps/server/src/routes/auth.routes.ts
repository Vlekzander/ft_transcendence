import { Router } from "express";
import {
	MissingEmailError,
	MissingPasswordError,
	MissingUsernameError,
} from "../errors/auth.errors";
import { DataManagerSingleton } from "../data/DataManager";
import { generateAccessToken, JWT_MAX_AGE } from "../utils/jwt.util";
import { readEnv } from "../utils/env.util";
import { AppDomainError } from "../errors/domain.errors";

const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
	try {
		const { username, email, password, confirmPassword } = req.body;

		if (!username) throw new MissingUsernameError();
		if (!email) throw new MissingEmailError();
		if (!password || !confirmPassword) throw new MissingPasswordError();
		if (password !== confirmPassword)
			throw new AppDomainError(
				"The password is different from the password confirmation",
			); //TODO: Temp
		const user = await DataManagerSingleton.getInstance().createUser({
			username,
			email,
			password,
		});
		res.cookie("token", generateAccessToken(user.uuid), {
			httpOnly: true,
			secure: readEnv("NODE_ENV") === "production",
			sameSite: "strict",
			maxAge: JWT_MAX_AGE,
		});
		res.status(200).json({ data: user });
	} catch (err) {
		next(err);
	}
});

export default authRouter;
