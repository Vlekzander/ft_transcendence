import { HttpError } from "./http.errors";

export class DuplicateEmailError extends HttpError {
	readonly statusCode = 409;

	constructor() {
		super("Email already exists");
		this.name = "DuplicateEmailError";
	}
}

export class DuplicateUsernameError extends HttpError {
	readonly statusCode = 409;

	constructor() {
		super("Username already exists");
		this.name = "DuplicateUsernameError";
	}
}

export class UnknownUserIdError extends Error {
	constructor() {
		super("Unknown user id");
		this.name = "UnknownUserIdError";
	}
}

export class UnknownAvatarIdError extends Error {
	constructor() {
		super("Unknown avatar id");
		this.name = "UnknownAvatarIdError";
	}
}
