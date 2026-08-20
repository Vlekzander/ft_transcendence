import { AppDomainError } from "@ft_transcendence/shared";

export class UserNotFoundError extends AppDomainError {
	constructor() {
		super("User not found");
		this.name = "UserNotFoundError";
	}
}

export class UserProfileError extends Error {
	constructor() {
		super("Failed to load the user profile");
		this.name = "UserProfileError";
	}
}

export class PartialProfileError extends Error {
	constructor() {
		super("Failed to fetch a part of the profile");
		this.name = "PartialProfileError";
	}
}
