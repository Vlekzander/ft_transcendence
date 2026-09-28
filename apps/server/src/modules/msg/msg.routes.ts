import { requireAuth } from "@/middlewares/auth.middleware";
import { UserParamsSchema } from "@ft_transcendence/shared";
import * as msgController from "./msg.controller";
import { Router } from "express";
import { validate } from "@/middlewares/validate.middleware";

const msgRouter = Router();

msgRouter.get(
	"/:uuid",
	requireAuth,
	validate({ params: UserParamsSchema }),
	msgController.getMsgHistory,
);

export default msgRouter;
