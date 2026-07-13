import { dataManager } from "../data";
import { CreateUserInput, UserDTO } from "../data/DataManager";
import {
	InvalidCredentialsError,
	InvalidEmailError,
	InvalidPasswordError,
	InvalidUsernameError,
} from "../errors/auth.errors";
import { generateToken } from "../utils/token.util";
import {
	isValidEmail,
	isValidPassword,
	isValidUsername,
} from "../utils/validation.util";

export async function registerUser(input: CreateUserInput): Promise<UserDTO> {
	const { email, username, password } = input;

	if (!isValidEmail(email)) {
		throw new InvalidEmailError();
	}
	if (!isValidUsername(username)) {
		throw new InvalidUsernameError();
	}
	if (!isValidPassword(password)) {
		throw new InvalidPasswordError();
	}

	return dataManager.createUser({ email, username, password });
}

export async function loginUser(
	email: unknown,
	password: unknown,
): Promise<{ user: UserDTO; token: string }> {
	if (!isValidEmail(email) || typeof password !== "string" || !password) {
		throw new InvalidCredentialsError();
	}

	const user = await dataManager.getUserByEmail(email);
	if (!user || user.banned) {
		throw new InvalidCredentialsError();
	}

	const isPasswordValid = await dataManager.validateUserPassword(
		user.uuid,
		password,
	);
	if (!isPasswordValid) {
		throw new InvalidCredentialsError();
	}

	const token = generateToken({ sub: user.uuid, role: user.role });
	return { user, token };
}
