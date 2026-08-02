import { AppDomainError } from "./domain.errors";

export class PasswordConfirmationError extends AppDomainError {
	constructor() {
		super("The password and confirmation do not match");
		this.name = "PasswordConfirmationError";
	}
}

export class AlreadyAuthError extends AppDomainError {
	constructor() {
		super("Already authenticated");
		this.name = "AlreadyAuthError";
	}
}

export class ValidationError extends AppDomainError {
	constructor(input: string, message: string) {
		super(message);
		this.name = `${input[0].toUpperCase() + input.slice(1)}ValidationError`;
	}
}
