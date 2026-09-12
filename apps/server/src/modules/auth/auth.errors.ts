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

export class AlreadyAuthError extends AppDomainError {
	constructor() {
		super("Already authenticated");
		this.name = "AlreadyAuthError";
	}
}

export class RequireAuthError extends AppDomainError {
	constructor() {
		super("Authentication required");
		this.name = "RequireAuthError";
	}
}

export class InvalidCredentialsError extends AppDomainError {
	constructor() {
		super("Invalid credentials");
		this.name = "InvalidCredentialsError";
	}
}

export class CannotEditUserError extends AppDomainError {
	constructor() {
		super("No permission for edit user");
		this.name = "CannotEditUserError";
	}
}
