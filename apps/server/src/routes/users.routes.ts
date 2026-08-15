import { Router } from "express";
import { DataManagerSingleton } from "../data/DataManager";
import { PublicUserDTO } from "@ft_transcendence/shared";
import { UnknownUserIdError } from "../errors/data-manager.errors";
import { prisma } from "../lib/prisma.lib";

const usersRouter = Router();

//TODO: REMOVE
usersRouter.post("/:uuid/history", async (req, res) => {
	const uuid = req.params.uuid;

	const game = await prisma.game.create({ data: { finished: true } });
	await prisma.userOnGame.create({
		data: { gameId: game.uuid, userId: uuid },
	});
	res.json({ game });
});

usersRouter.get("/:uuid", async (req, res) => {
	const uuid = req.params.uuid;

	const data = await DataManagerSingleton.getInstance().getUserById(uuid);
	if (data === null) throw new UnknownUserIdError();
	let avatar = null;
	if (data?.avatarUuid !== null)
		avatar = await DataManagerSingleton.getInstance().getAvatarById(
			data.avatarUuid,
		);

	const user: PublicUserDTO = {
		uuid: data?.uuid,
		username: data?.username,
		avatar: avatar,
	};

	res.json({ user });
});

usersRouter.get("/:uuid/history", async (req, res) => {
	const uuid = req.params.uuid;

	const history =
		await DataManagerSingleton.getInstance().getUserHistory(uuid);

	res.json({ history });
});

export default usersRouter;
