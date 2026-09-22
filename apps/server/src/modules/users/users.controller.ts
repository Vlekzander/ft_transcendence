import { NextFunction, Response } from "express";
import { sharedService } from "../shared/shared.service";
import {
	toUserResponseDTO,
	Achievement,
	EditUserSchema,
	Stat,
	UserParamsSchema,
	toFriendshipDTO,
	toSentFriendRequestDTO,
	toPendingFriendRequestDTO,
} from "./users.mapper";
import { ParsedRequest } from "../../middlewares/validate.middleware";
import {
	InvalidCredentialsError,
	NoFileUploadError,
	UnknownUserIdError,
} from "../../errors";
import { usersService } from "./users.service";
import { AVATAR_DIR } from "../../config/upload.config";
import {
	CreateFriendshipSchema,
	EditFriendshipSchema,
	FriendshipDTO,
	PendingFriendRequestDTO,
	SentFriendRequestDTO,
} from "@ft_transcendence/shared";
import { toPublicUserDTO } from "../shared/shared.mapper";

type UserRequest = ParsedRequest<
	{ params: typeof UserParamsSchema },
	Express.Multer.File
>;

type UpdateUserRequest = ParsedRequest<{
	body: typeof EditUserSchema;
	params: typeof UserParamsSchema;
}>;

type CreateFriendshipRequest = ParsedRequest<{
	body: typeof CreateFriendshipSchema;
	params: typeof UserParamsSchema;
}>;

type EditFriendshipRequest = ParsedRequest<{
	body: typeof EditFriendshipSchema;
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

		const isPasswordValid = await sharedService.validateUserPassword(
			uuid,
			currentPassword,
		);
		if (!isPasswordValid) throw new InvalidCredentialsError();
		const user = await usersService.updateUser(uuid, userUpdates);

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

		const dto = toUserResponseDTO(user);
		res.json({ user: dto });
	} catch (err) {
		next(err);
	}
}

export async function getFriends(
	req: UserRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;

		const friendships = await usersService.getFriendships(uuid);
		const friends: FriendshipDTO[] = friendships.map((element) =>
			toFriendshipDTO(element),
		);

		res.status(200).json({ friends: friends });
	} catch (err) {
		next(err);
	}
}

export async function getPendingFriendRequests(
	req: UserRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;

		const requests = await usersService.getPendingFriendRequests(uuid);
		const pendingRequests: PendingFriendRequestDTO[] = requests.map(
			(element) => toPendingFriendRequestDTO(element),
		);

		res.status(200).json({ pendingRequests: pendingRequests });
	} catch (err) {
		next(err);
	}
}

export async function getSentFriendRequests(
	req: UserRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;

		const requests = await usersService.getSentFriendRequests(uuid);
		const sentRequests: SentFriendRequestDTO[] = requests.map((element) =>
			toSentFriendRequestDTO(element),
		);

		res.status(200).json({ sentRequests: sentRequests });
	} catch (err) {
		next(err);
	}
}

export async function sendFriendRequest(
	req: CreateFriendshipRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;
		const { receiverId } = req.parsedBody!;

		const friendRequest = await usersService.sendFriendRequest(
			uuid,
			receiverId,
		);

		res.status(200).json({
			sentRequest: toSentFriendRequestDTO(friendRequest),
		});
	} catch (err) {
		next(err);
	}
}

export async function acceptFriendRequest(
	req: EditFriendshipRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;
		const { requestId } = req.parsedBody!;

		const friend = await usersService.acceptFriendRequest(uuid, requestId);

		res.status(200).json({ friend: toFriendshipDTO(friend) });
	} catch (err) {
		next(err);
	}
}

export async function deleteFriendRequest(
	req: EditFriendshipRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;
		const { requestId } = req.parsedBody!;

		await usersService.deleteFriendRequest(uuid, requestId);

		res.sendStatus(204);
	} catch (err) {
		next(err);
	}
}
