import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireGuest } from "../middlewares/guest.middleware";
import { loginUser, registerUser } from "../services/auth.service";

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const authRouter = Router();

authRouter.post("/register", requireGuest, async (req, res) => {
	const user = await registerUser(req.body);
	res.status(201).json(user);
});

authRouter.post("/login", requireGuest, async (req, res) => {
	const { email, password } = req.body;
	const { user, token } = await loginUser(email, password);

	res.cookie("token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: COOKIE_MAX_AGE_MS,
	});
	res.status(200).json(user);
});

authRouter.post("/logout", requireAuth, (_req, res) => {
	res.clearCookie("token");
	res.status(200).json({ message: "Logged out" });
});
