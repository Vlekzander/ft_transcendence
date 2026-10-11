import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
	CreateLobbySchema,
	LobbyParamsSchema,
	JoinLobbySchema,
	UpdateLobbySchema,
	LobbyPlayerBodySchema,
} from "@ft_transcendence/shared";
import * as lobbyController from "./lobby.controller";
import { validate } from "../../middlewares/validate.middleware";

const lobbyRouter = Router();

lobbyRouter.post(
	"/",
	requireAuth,
	validate({ body: CreateLobbySchema }),
	lobbyController.createLobbyController,
);

lobbyRouter.get("/", requireAuth, lobbyController.listLobbiesController);

lobbyRouter.get("/me", requireAuth, lobbyController.getMyLobbyController);

lobbyRouter.get(
	"/:uuid",
	requireAuth,
	validate({ params: LobbyParamsSchema }),
	lobbyController.getByUuidLobbyController,
);

lobbyRouter.post(
	"/join",
	requireAuth,
	validate({ body: JoinLobbySchema }),
	lobbyController.joinLobbyController,
);

lobbyRouter.post(
	"/:uuid/leave",
	requireAuth,
	validate({ params: LobbyParamsSchema }),
	lobbyController.leaveLobbyController,
);

lobbyRouter.put(
	"/:uuid/settings",
	requireAuth,
	validate({
		params: LobbyParamsSchema,
		body: UpdateLobbySchema,
	}),
	lobbyController.updateLobbyController,
);

lobbyRouter.post(
	"/:uuid/ban",
	requireAuth,
	validate({ params: LobbyParamsSchema, body: LobbyPlayerBodySchema }),
	lobbyController.banLobbyController,
);

lobbyRouter.post(
	"/:uuid/unban",
	requireAuth,
	validate({ params: LobbyParamsSchema, body: LobbyPlayerBodySchema }),
	lobbyController.unbanLobbyController,
);

export default lobbyRouter;
