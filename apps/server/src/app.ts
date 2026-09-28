import { hello } from "@ft_transcendence/shared";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { AVATAR_DIR } from "./config/upload.config";
import authRouter from "./modules/auth/auth.routes";
import usersRouter from "./modules/users/users.routes";
<<<<<<< HEAD
import msgRouter from "./modules/msg/msg.routes";
=======
import lobbyRouter from "./modules/lobby/lobby.routes";
>>>>>>> 94bb6aa (cleaned up incoherent code for lobby part. added Lobby array as component of a user in prisma scheme. For the moment, Lobbies are store on server memory, not saved in DB.)

const WEB_PORT = process.env.WEB_PORT || 5173;

const app = express();

app.use(
	cors({
		origin: `http://localhost:${WEB_PORT}`,
		credentials: true,
	}),
);
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/msg", msgRouter);

app.get("/", (_req, res) => {
	res.json({ message: hello("API") });
});

app.use(
	"/avatars",
	express.static(AVATAR_DIR, {
		dotfiles: "deny",
		index: false,
		maxAge: "7d",
	}),
);

app.use("/lobbies", lobbyRouter);

app.use(errorHandler);
export default app;
