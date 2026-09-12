import { Router } from "express";
import { requireAuth, requireGuest } from "../../middlewares/auth.middleware";
import { LoginUserSchema, RegisterUserSchema } from "@ft_transcendence/shared";
import * as authController from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";

const authRouter = Router();

authRouter.post(
	"/register",
	requireGuest,
	validate({ body: RegisterUserSchema }),
	authController.register,
);

authRouter.post(
	"/login",
	requireGuest,
	validate({ body: LoginUserSchema }),
	authController.login,
);

authRouter.post("/logout", requireAuth, authController.logout);

authRouter.get("/whoami", authController.whoami);

export default authRouter;
