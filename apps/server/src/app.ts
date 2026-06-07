import { hello } from "@ft_transcendence/shared";
import cors from "cors";
import express from "express";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
	res.json({ message: hello("API") });
});

export default app;
