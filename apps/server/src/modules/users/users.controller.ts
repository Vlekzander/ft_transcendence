import { NextFunction, Response } from "express";
import { sharedService } from "../shared/shared.service";
import {
	toPublicUserDTO,
	toUserResponseDTO,
	Achievement,
	EditUserSchema,
	Stat,
	UserParamsSchema,
	FriendDTO,
} from "./users.mapper";
import { ParsedRequest } from "../../middlewares/validate.middleware";
import {
	InvalidCredentialsError,
	NoFileUploadError,
	UnknownUserIdError,
} from "../../errors";
import { usersService } from "./users.service";
import { AVATAR_DIR } from "../../config/upload.config";

type UserRequest = ParsedRequest<
	{ params: typeof UserParamsSchema },
	Express.Multer.File
>;

type UpdateUserRequest = ParsedRequest<{
	body: typeof EditUserSchema;
	params: typeof UserParamsSchema;
}>;

export async function getUser(
	req: UserRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;

		const user = await sharedService.getUserById(uuid);
		if (!user) throw new UnknownUserIdError();

		const dto = toPublicUserDTO(user);
		res.status(200).json({ user: dto });
	} catch (err) {
		next(err);
	}
}

export async function getUserHistory(
	req: UserRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;

		const history = await usersService.getUserHistory(uuid);

		res.status(200).json({ history: history });
	} catch (err) {
		next(err);
	}
}

export async function getUserStats(
	_req: UserRequest,
	res: Response,
	_next: NextFunction,
) {
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

	res.status(200).json({ stats: stats });
}

export async function getUserAchievements(
	_req: UserRequest,
	res: Response,
	_next: NextFunction,
) {
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
	res.status(200).json({ achievements: achievements });
}

export async function getUserFriends(
	_req: UserRequest,
	res: Response,
	_next: NextFunction,
) {
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

	res.status(200).json({ friends: friends });
}

export async function updateUser(
	req: UpdateUserRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;
		const {
			currentPassword,
			confirmPassword: _confirmPassword,
			...userUpdates
		} = req.parsedBody!;

		const isPasswordValid = sharedService.validateUserPassword(
			uuid,
			currentPassword,
		);
		if (!isPasswordValid) throw new InvalidCredentialsError();
		const user = await usersService.updateUser(uuid, userUpdates);
		if (!user) throw new UnknownUserIdError();
		const dto = toUserResponseDTO(user);
		res.status(200).json({ user: dto });
	} catch (err) {
		next(err);
	}
}

export async function updateAvatar(
	req: UserRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;

		const file = req.file;
		if (!file) throw new NoFileUploadError();
		const avatarPath = file.path.replace(`${AVATAR_DIR}/`, "");
		const user = await usersService.updateUserAvatar(uuid, avatarPath);

		if (!updateUser) throw new UnknownUserIdError();

		const dto = toUserResponseDTO(user);
		res.json({ user: dto });
	} catch (err) {
		next(err);
	}
}
