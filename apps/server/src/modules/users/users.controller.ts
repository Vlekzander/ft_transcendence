import { NextFunction, Response } from "express";
import { sharedService } from "../shared/shared.service";
import {
	toUserResponseDTO,
	EditUserSchema,
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
	PublicUserDTO,
	SentFriendRequestDTO,
	StringQuerySchema,
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

type StringQueryRequest = ParsedRequest<{
	query: typeof StringQuerySchema;
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
	req: UserRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;

		const stats = await usersService.getUserStats(uuid);

		return res.status(200).json({ stats: stats });
	} catch (err) {
		next(err);
	}
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

export async function searchUser(
	req: StringQueryRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const { query } = req.parsedQuery!;
		const result = await usersService.searchUser(query);

		const users: PublicUserDTO[] = result.map((element) =>
			toPublicUserDTO(element),
		);

		res.status(200).json({ users: users });
	} catch (err) {
		next(err);
	}
}
