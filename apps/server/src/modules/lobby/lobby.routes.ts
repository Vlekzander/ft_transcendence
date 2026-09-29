import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { CreateLobbySchema, LobbyParamsSchema, JoinLobbySchema, UpdateLobbySettingsSchema } from "@ft_transcendence/shared";
import * as lobbyController from "./lobby.controller";
import { validate } from "../../middlewares/validate.middleware";

const lobbyRouter = Router();

lobbyRouter.post(
	"/",
	requireAuth,
	validate({ body: CreateLobbySchema }),
	lobbyController.createLobbyController,
);

lobbyRouter.get(
    "/",
    requireAuth,
    lobbyController.listLobbiesController,
);

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

lobbyRouter.patch(
    "/:uuid/settings",
    requireAuth,
    validate({
        params: LobbyParamsSchema,
        body: UpdateLobbySettingsSchema,
    }),
    lobbyController.updateLobbySettingsController,
);

lobbyRouter.delete(
    "/:uuid",
    requireAuth,
    validate({ params: LobbyParamsSchema }),
    lobbyController.deleteLobbyController,
);

export default lobbyRouter;
