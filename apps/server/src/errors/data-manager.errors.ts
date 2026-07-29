export class DuplicateElementError extends Error {
	constructor(message: string) {
		super(message + " already exists");
		this.name = "DuplicateElementError";
	}
}

export class DuplicateEmailError extends DuplicateElementError {
	constructor() {
		super("Email");
		this.name = "DuplicateEmailError";
	}
}

export class DuplicateUsernameError extends DuplicateElementError {
	constructor() {
		super("Username");
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
