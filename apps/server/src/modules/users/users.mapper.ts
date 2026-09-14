export {
	type UserEntity,
	toUserResponseDTO,
	toPublicUserDTO,
} from "../shared/shared.mapper";

export interface UpdateUserInput {
	email?: string;
	username?: string;
	password?: string;
}
