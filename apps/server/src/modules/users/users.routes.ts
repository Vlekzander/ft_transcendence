import { EditUserSchema, UserParamsSchema } from "@ft_transcendence/shared";
import { Router } from "express";
import * as usersController from "./users.controller";
import { validate } from "../../middlewares/validate.middleware";
import {
	requireAuth,
	requireUserOwnership,
} from "../../middlewares/auth.middleware";

const usersRouter = Router();

usersRouter.get(
	"/:uuid",
	validate({ params: UserParamsSchema }),
	usersController.getUser,
);

usersRouter.patch(
	"/:uuid",
	requireAuth,
	requireUserOwnership,
	validate({ params: UserParamsSchema, body: EditUserSchema }),
	usersController.updateUser,
);

export default usersRouter;
