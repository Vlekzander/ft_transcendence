import { AppDomainError } from "@ft_transcendence/shared";

export class UnknownElementError extends AppDomainError {
	constructor(element: string) {
		super(`Unknown ${element}`);
		this.name = "UnknownElementError";
	}
}

export class UnknownUserIdError extends UnknownElementError {
	constructor() {
		super("User Id");
		this.name = "UnknownUserIdError";
	}
}

export class UnknownFriendRequestError extends UnknownElementError {
	constructor() {
		super("FriendRequest");
		this.name = "UnknownFriendRequestError";
	}
}

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

export class InvalidJWTError extends InvalidElementError {
	constructor() {
		super("JWT");
		this.name = "InvalidJWTError";
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

export class InvalidFileError extends AppDomainError {
	constructor(message: string) {
		super(message);
		this.name = "InvalidFileError";
	}
}

export class NoFileUploadError extends InvalidFileError {
	constructor() {
		super("No file uploaded");
		this.name = "NoFileUploadError";
	}
}

export class InvalidFileTypeError extends InvalidFileError {
	constructor() {
		super("Invalid file type uploaded");
		this.name = "InvalidFileTypeError";
	}
}

export class InvalidFileSizeError extends InvalidFileError {
	constructor(size: number) {
		super(`Invalid file size uploaded (max: ${size} MB)`);
		this.name = "InvalidFileSizeError";
	}
}

export class SelfFriendRequestError extends AppDomainError {
	constructor() {
		super("You can't send yourself a friend request");
		this.name = "SelfFriendRequestError";
	}
}

export class FriendshipAlreadyExistError extends AppDomainError {
	constructor() {
		super("This friendship already exist");
		this.name = "FriendshipAlreadyExistError";
	}
}

export class PendingFriendRequestExistError extends AppDomainError {
	constructor() {
		super("A pending friend request already exist");
		this.name = "PendingFriendRequestExistError";
	}
}

export class SelfMessageError extends AppDomainError {
	constructor() {
		super("You can't send a message to yourself");
		this.name = "SelfMessageError";
	}
}

export class LobbyNotFoundError extends AppDomainError {
	constructor() {
		super("Lobby not found");
		this.name = "LobbyNotFoundError";
	}
}

export class NotHostError extends AppDomainError {
	constructor() {
		super("Only the host can perform this action");
		this.name = "NotHostError";
	}
}

export class UserNotInLobbyError extends AppDomainError {
	constructor() {
		super("User is not in the lobby");
		this.name = "UserNotInLobbyError";
	}
}

export class CannotBanHostError extends AppDomainError {
	constructor() {
		super("The host cannot be banned");
		this.name = "CannotBanHostError";
	}
}

export class UserAlreadyInLobbyError extends AppDomainError {
	constructor() {
		super("User is already in the lobby");
		this.name = "UserAlreadyInLobbyError";
	}
}

export class UserBannedFromLobbyError extends AppDomainError {
	constructor() {
		super("User is banned from this lobby");
		this.name = "UserBannedFromLobbyError";
	}
}

export class LobbyFullError extends AppDomainError {
	constructor() {
		super("Lobby is full");
		this.name = "LobbyFullError";
	}
}

export class NotEnoughReadyPlayersError extends AppDomainError {
	constructor() {
		super("At least 2 players must be ready");
		this.name = "NotEnoughReadyPlayersError";
	}
}

export class UnauthorizedLobbyAccessError extends AppDomainError {
	constructor() {
		super("User is not authorized to access this lobby");
		this.name = "UnauthorizedLobbyAccessError";
	}
}

export class UnauthorizedUserActionError extends AppDomainError {
	constructor() {
		super("User is not authorized to perform this action");
		this.name = "UnauthorizedUserActionError";
	}
}

export class TooManyCustomWordsError extends AppDomainError {
	constructor() {
		super("Too many custom words provided");
		this.name = "TooManyCustomWordsError";
	}
}

export class NoWordsErrorInCustomWords extends AppDomainError {
	constructor() {
		super(
			"No valid words found in custom words. At least one valid word is required.",
		);
		this.name = "NoWordsErrorInCustomWords";
	}
}
