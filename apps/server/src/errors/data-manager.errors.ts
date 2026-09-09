import { AppDomainError } from "@ft_transcendence/shared";

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
