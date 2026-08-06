import { hello } from "@ft_transcendence/shared";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import { errorHandler } from "./middlewares/errorHandler.middleware";

const app = express();

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);

app.get("/", (_req, res) => {
	res.json({ message: hello("API") });
});

app.use(errorHandler);
export default app;
