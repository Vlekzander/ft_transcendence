import { requireAuth } from "@/middlewares/auth.middleware";
import { UserParamsSchema } from "@ft_transcendence/shared";
import * as chatController from "./chat.controller";
import { Router } from "express";
import { validate } from "@/middlewares/validate.middleware";

const chatRouter = Router();

chatRouter.get(
	"/:uuid",
	requireAuth,
	validate({ params: UserParamsSchema }),
	chatController.getChatHistory,
);

export default chatRouter;
