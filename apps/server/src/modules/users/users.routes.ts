import {
	CreateFriendshipSchema,
	EditFriendshipSchema,
	EditUserSchema,
	UserParamsSchema,
} from "@ft_transcendence/shared";
import { Router } from "express";
import * as usersController from "./users.controller";
import { validate } from "../../middlewares/validate.middleware";
import {
	requireAuth,
	requireUserOwnership,
} from "../../middlewares/auth.middleware";
import { uploadAvatar } from "../../middlewares/upload.middleware";

//TODO: REMOVE
import { prisma } from "../../lib/prisma.lib";

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

usersRouter.post(
	"/:uuid",
	requireAuth,
	requireUserOwnership,
	uploadAvatar,
	validate({ params: UserParamsSchema }),
	usersController.updateAvatar,
);

usersRouter.get(
	"/:uuid/history",
	validate({ params: UserParamsSchema }),
	usersController.getUserHistory,
);

usersRouter.get(
	"/:uuid/stats",
	validate({ params: UserParamsSchema }),
	usersController.getUserStats,
);

usersRouter.get(
	"/:uuid/achievements",
	validate({ params: UserParamsSchema }),
	usersController.getUserAchievements,
);

usersRouter.get(
	"/:uuid/friends",
	validate({ params: UserParamsSchema }),
	usersController.getFriends,
);

usersRouter.get(
	"/:uuid/friends/pending",
	requireAuth,
	requireUserOwnership,
	validate({ params: UserParamsSchema }),
	usersController.getPendingFriendRequests,
);

usersRouter.post(
	"/:uuid/friends",
	requireAuth,
	requireUserOwnership,
	validate({ body: CreateFriendshipSchema, params: UserParamsSchema }),
	usersController.sendFriendRequest,
);

usersRouter.patch(
	"/:uuid/friends",
	requireAuth,
	requireUserOwnership,
	validate({ body: EditFriendshipSchema, params: UserParamsSchema }),
	usersController.acceptFriendRequest,
);

usersRouter.delete(
	"/:uuid/friends",
	requireAuth,
	requireUserOwnership,
	validate({ body: EditFriendshipSchema, params: UserParamsSchema }),
	usersController.deleteFriendRequest,
);

//TODO: REMOVE
usersRouter.get("/:uuid/fillhistory", async (req, res) => {
	const uuid = req.params.uuid;

	const game = await prisma.game.create({ data: { status: "FINISHED" } });
	await prisma.userOnGame.create({
		data: { gameId: game.uuid, userId: uuid },
	});
	res.status(200).json({ game });
});

export default usersRouter;
