import { AppDomainError } from "./domain.errors";

export class MissingElementError extends AppDomainError {
	constructor(message: string) {
		super(message + " is missing");
		this.name = "MissingElementError";
	}
}

export class MissingEmailError extends MissingElementError {
	constructor() {
		super("Email");
		this.name = "MissingEmailError";
	}
}

export class MissingUsernameError extends MissingElementError {
	constructor() {
		super("Username");
		this.name = "MissingUsernameError";
	}
}

export class MissingPasswordError extends MissingElementError {
	constructor() {
		super("Password");
		this.name = "MissingPasswordError";
	}
}
