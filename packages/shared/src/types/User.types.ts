import { UserResponseDTO } from "../schemas/user.schemas";
import { Status } from "./Status.types";

export type FriendDTO = {
	user: UserResponseDTO;
	status: Status;
};
