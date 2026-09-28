import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { CreateLobbySchema } from "@ft_transcendence/shared";
import * as lobbyController from "./lobby.controller";
import { validate } from "../../middlewares/validate.middleware";

const lobbyRouter = Router();

lobbyRouter.post(
	"/",
	requireAuth,
	validate({ body: CreateLobbySchema }),
	lobbyController.createLobbyController,
);

export default lobbyRouter;
