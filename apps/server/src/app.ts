import { hello } from "@ft_transcendence/shared";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import usersRouter from "./routes/users.routes";

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

app.get("/", (_req, res) => {
	res.json({ message: hello("API") });
});

app.use(errorHandler);
export default app;
