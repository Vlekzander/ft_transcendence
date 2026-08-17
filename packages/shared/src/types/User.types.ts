import { UserResponseDTO } from "../schemas/user.schemas";
import { Status } from "./Status.types";

export type AvatarDTO = {
	uuid: string;
	path: string;
};

export type PublicUserDTO = {
	uuid: string;
	username: string;
	avatar: AvatarDTO | null;
};

export type FriendDTO = {
	user: UserResponseDTO;
	status: Status;
};
