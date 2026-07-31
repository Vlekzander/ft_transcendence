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

export class InvalidElementError extends Error {
	constructor(message: string) {
		super(message + " is invalid");
		this.name = "InvalidElementError";
	}
}

export class InvalidIdError extends Error {
	constructor() {
		super("Id");
		this.name = "InvalidIdError";
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
