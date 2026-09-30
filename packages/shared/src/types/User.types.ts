import { type UserResponseDTO } from "../schemas/user.schemas";
import { type Status } from "./Status.types";

export type FriendDTO = {
	user: UserResponseDTO;
	status: Status;
};
