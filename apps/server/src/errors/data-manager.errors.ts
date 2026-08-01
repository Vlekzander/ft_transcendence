import { AppDomainError } from "./domain.errors";

export class DuplicateElementError extends AppDomainError {
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

export class InvalidElementError extends AppDomainError {
	constructor(message: string) {
		super(message + " is invalid");
		this.name = "InvalidElementError";
	}
}

export class InvalidIdError extends InvalidElementError {
	constructor() {
		super("Id");
		this.name = "InvalidIdError";
	}
}

export class UnknownUserIdError extends AppDomainError {
	constructor() {
		super("Unknown user id");
		this.name = "UnknownUserIdError";
	}
}

export class UnknownAvatarIdError extends AppDomainError {
	constructor() {
		super("Unknown avatar id");
		this.name = "UnknownAvatarIdError";
	}
}
