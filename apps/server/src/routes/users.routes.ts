import { Router } from "express";
import { DataManagerSingleton } from "../data/DataManager";
import { Achievement, PublicUserDTO, Stat } from "@ft_transcendence/shared";
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

usersRouter.get("/:uuid/stats", async (_req, res) => {
	// const uuid = req.params.uuid;

	//WARN: TEMP FAKE STATS
	const stats: Stat[] = [
		{
			icon: "gamepad-2",
			label: "Game Played",
			value: "193",
		},
		{
			icon: "trophy",
			label: "Wins",
			value: "42",
		},
		{
			icon: "lightbulb",
			label: "Words Guessed",
			value: "1247",
		},
		{
			icon: "pencil-line",
			label: "Drawings",
			value: "251",
		},
		{
			icon: "star",
			label: "Best score",
			value: "520",
		},
	];

	res.json({ stats });
});

usersRouter.get("/:uuid/achievements", async (_req, res) => {
	// const uuid = req.params.uuid;

	//WARN: TEMP FAKE ACHIEVEMENTS
	const achievements: Achievement[] = [
		{
			uuid: crypto.randomUUID(),
			icon: "flame",
			title: "aaa",
			description: "bbb",
			objective: 13,
			current: 1,
		},
		{
			uuid: crypto.randomUUID(),
			icon: "zap",
			title: "ccc",
			description: "ddd",
			objective: 100,
			current: 57,
		},
		{
			uuid: crypto.randomUUID(),
			icon: "user",
			title: "Blablablabla",
			description: "blibliblibli",
			objective: 38,
			current: 192,
		},
	];
	res.json({ achievements });
});

export default usersRouter;
