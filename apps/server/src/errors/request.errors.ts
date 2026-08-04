import {
	AlreadyAuthError,
	RequireAuthError,
	ValidationError,
} from "./auth.errors";
import {
	DuplicateElementError,
	InvalidElementError,
	UnknownAvatarIdError,
	UnknownUserIdError,
} from "./data-manager.errors";
import { AppDomainError } from "./domain.errors";

type ErrorResponse = {
	status: number;
	code: string;
	message: string;
};

export function mapError(err: Error): ErrorResponse {
	const error = { status: 500, code: err.name, message: err.message };

	if (err instanceof DuplicateElementError)
		return ((error.status = 409), error);
	if (err instanceof InvalidElementError)
		return ((error.status = 400), error);
	if (
		err instanceof UnknownUserIdError ||
		err instanceof UnknownAvatarIdError
	)
		return ((error.status = 404), error);
	if (err instanceof ValidationError) return ((error.status = 400), error);
	if (err instanceof AlreadyAuthError) return ((error.status = 403), error);
	if (err instanceof RequireAuthError) return ((error.status = 401), error);

	if (err instanceof AppDomainError) return ((error.status = 400), error);
	return {
		status: 500,
		code: "InternalServerError",
		message: "Internal server error",
	};
}
