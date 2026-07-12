import { Router } from "express";
import { dataManager } from "../data";
import {
	DuplicateEmailError,
	DuplicateUsernameError,
} from "../errors/data-manager.errors";
import { generateToken } from "../utils/token.util";
import {
	isValidEmail,
	isValidPassword,
	isValidUsername,
	MIN_PASSWORD_LENGTH,
} from "../utils/validation.util";

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
	const { email, username, password } = req.body;

	if (!isValidEmail(email)) {
		res.status(400).json({ message: "Invalid email address" });
		return;
	}
	if (!isValidUsername(username)) {
		res.status(400).json({ message: "Username is required" });
		return;
	}
	if (!isValidPassword(password)) {
		res.status(400).json({
			message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
		});
		return;
	}

	try {
		const user = await dataManager.createUser({
			email,
			username,
			password,
		});
		res.status(201).json({ uuid: user.uuid, username: user.username });
	} catch (err) {
		if (
			err instanceof DuplicateEmailError ||
			err instanceof DuplicateUsernameError
		) {
			res.status(409).json({ message: err.message });
			return;
		}
		throw err;
	}
});

authRouter.post("/login", async (req, res) => {
	const { email, password } = req.body;

	if (!isValidEmail(email) || typeof password !== "string" || !password) {
		res.status(401).json({ message: "Invalid credentials" });
		return;
	}

	const user = await dataManager.getUserByEmail(email);
	if (!user || user.banned) {
		res.status(401).json({ message: "Invalid credentials" });
		return;
	}

	const isPasswordValid = await dataManager.validateUserPassword(
		user.uuid,
		password,
	);
	if (!isPasswordValid) {
		res.status(401).json({ message: "Invalid credentials" });
		return;
	}

	const token = generateToken({ sub: user.uuid, role: user.role });
	res.cookie("token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: COOKIE_MAX_AGE_MS,
	});
	res.status(200).json({ uuid: user.uuid, username: user.username });
});

authRouter.post("/logout", (_req, res) => {
	res.clearCookie("token");
	res.status(200).json({ message: "Logged out" });
});
