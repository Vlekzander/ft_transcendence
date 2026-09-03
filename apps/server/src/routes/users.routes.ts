import { Router } from "express";
import { DataManagerSingleton } from "../data/DataManager";
import {
	Achievement,
	FriendDTO,
	PublicUserDTO,
	Stat,
	parseEditUser,
} from "@ft_transcendence/shared";
import { UnknownUserIdError } from "../errors/data-manager.errors";
import { prisma } from "../lib/prisma.lib";
import {
	requireAuth,
	requireUserOwnership,
} from "../middlewares/auth.middleware";
import { InvalidCredentialsError } from "../errors/auth.errors";
import { toUserResponseDTO } from "../data/User.data";
import { NoFileUploadError } from "../errors/upload.errors";
import { uploadAvatar } from "../middlewares/upload.middleware";
import { UPLOAD_DIR } from "../config/upload.config";

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

	const user: PublicUserDTO = {
		uuid: data?.uuid,
		username: data?.username,
		avatarPath: data?.avatarPath,
	};

	res.json({ user });
});

usersRouter.patch(
	"/:uuid",
	requireAuth,
	requireUserOwnership,
	async (req, res) => {
		const { uuid } = req.params;
		const {
			currentPassword,
			confirmPassword: _confirmPassword,
			...userUpdates
		} = parseEditUser(req.body);

		if (typeof uuid !== "string") throw new UnknownUserIdError();

		const dataManager = DataManagerSingleton.getInstance();

		const isPasswordValid = await dataManager.validateUserPassword(
			uuid,
			currentPassword,
		);
		if (!isPasswordValid) throw new InvalidCredentialsError();

		const user = await DataManagerSingleton.getInstance().updateUser(
			uuid,
			userUpdates,
		);
		if (!user) throw new UnknownUserIdError();
		res.json({ user: toUserResponseDTO(user) });
	},
);

usersRouter.post(
	"/:uuid",
	requireAuth,
	requireUserOwnership,
	uploadAvatar,
	(req, res) => {
		const { uuid } = req.params;

		if (typeof uuid !== "string") throw new UnknownUserIdError();
		if (!req.file) throw new NoFileUploadError();

		const path = req.file.path.replace(UPLOAD_DIR, "");

		res.json({
			filename: req.file.filename,
			path: path,
			mimetpye: req.file.mimetype,
			size: req.file.size,
		});
	},
);

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

usersRouter.get("/:uuid/friends", async (_req, res) => {
	// const uuid = req.params.uuid;

	//WARN: TEMP FAKE FRIENDSLIST
	const friends: FriendDTO[] = [
		{
			user: {
				uuid: crypto.randomUUID(),
				username: "Another",
				email: "spongybobby@gmail.com",
				avatarPath: null,
			},
			status: "in_game",
		},
		{
			user: {
				uuid: crypto.randomUUID(),
				username: "Blabla",
				email: "spongybobby@gmail.com",
				avatarPath: null,
			},
			status: "online",
		},
		{
			user: {
				uuid: crypto.randomUUID(),
				username: "Nobody",
				email: "spongybobby@gmail.com",
				avatarPath: null,
			},
			status: "offline",
		},
	];

	res.json({ friends });
});

export default usersRouter;
