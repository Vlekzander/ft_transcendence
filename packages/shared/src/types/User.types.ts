import { UserResponseDTO } from "../schemas/user.schemas";
import { Status } from "./Status.types";

export type PublicUserDTO = {
	uuid: string;
	username: string;
	avatarPath: string | null;
};

export type FriendDTO = {
	user: UserResponseDTO;
	status: Status;
};
