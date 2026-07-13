import { HttpError } from "./http.errors";
import { MIN_PASSWORD_LENGTH } from "../utils/validation.util";

export class InvalidEmailError extends HttpError {
	readonly statusCode = 400;

	constructor() {
		super("Invalid email address");
		this.name = "InvalidEmailError";
	}
}

export class InvalidUsernameError extends HttpError {
	readonly statusCode = 400;

	constructor() {
		super("Username is required");
		this.name = "InvalidUsernameError";
	}
}

export class InvalidPasswordError extends HttpError {
	readonly statusCode = 400;

	constructor() {
		super(
			`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
		);
		this.name = "InvalidPasswordError";
	}
}

export class InvalidCredentialsError extends HttpError {
	readonly statusCode = 401;

	constructor() {
		super("Invalid credentials");
		this.name = "InvalidCredentialsError";
	}
}

export class UnauthenticatedError extends HttpError {
	readonly statusCode = 401;

	constructor() {
		super("Authentication required");
		this.name = "UnauthenticatedError";
	}
}

export class AlreadyAuthenticatedError extends HttpError {
	readonly statusCode = 409;

	constructor() {
		super("Already authenticated");
		this.name = "AlreadyAuthenticatedError";
	}
}
