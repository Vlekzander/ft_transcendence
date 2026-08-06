import { AppDomainError } from "@ft_transcendence/shared";

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
