import { NextFunction, Response } from "express";
import { sharedService } from "../shared/shared.service";
import { toPublicUserDTO, toUserResponseDTO } from "./users.mapper";
import { ParsedRequest } from "../../middlewares/validate.middleware";
import {
	InvalidCredentialsError,
	NoFileUploadError,
	UnknownUserIdError,
} from "../../errors";
import { EditUserSchema, UserParamsSchema } from "@ft_transcendence/shared";
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
		res.status(200).json({ data: dto });
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
