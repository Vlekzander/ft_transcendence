import { ErrorRequestHandler } from "express";
import { AppDomainError, ValidationError } from "@ft_transcendence/shared";
import {
	AlreadyAuthError,
	CannotEditUserError,
	DuplicateElementError,
	InvalidCredentialsError,
	InvalidElementError,
	RequireAuthError,
	UnknownUserIdError,
	TooManyCustomWordsError,
	UnauthorizedLobbyAccessError,
	UnauthorizedUserActionError,
	LobbyNotFoundError,
	LobbyFullError,
	UserAlreadyInLobbyError,
	UserBannedFromLobbyError,
} from "../errors";

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
	if (err instanceof UnknownUserIdError) return ((error.status = 404), error);
	if (err instanceof ValidationError || err instanceof SyntaxError)
		return ((error.status = 400), error);
	if (err instanceof AlreadyAuthError) return ((error.status = 403), error);
	if (err instanceof RequireAuthError) return ((error.status = 401), error);
	if (err instanceof CannotEditUserError)
		return ((error.status = 403), error);
	if (err instanceof InvalidCredentialsError)
		return ((error.status = 401), error);

	//lobby errors >>>>
	if (err instanceof TooManyCustomWordsError)
		return ((error.status = 400), error);
	if (
		err instanceof UnauthorizedLobbyAccessError ||
		err instanceof UnauthorizedUserActionError ||
		err instanceof UserBannedFromLobbyError
	)
		return ((error.status = 403), error);
	if (err instanceof LobbyNotFoundError) return ((error.status = 404), error);
	if (err instanceof LobbyFullError || err instanceof UserAlreadyInLobbyError)
		return ((error.status = 409), error);

	//lobby errors <<<<

	if (err instanceof AppDomainError) return ((error.status = 400), error);

	console.error(err);
	return {
		status: 500,
		code: "InternalServerError",
		message: "Internal server error",
	};
}
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
	if (res.headersSent) return next(err);

	const error = mapError(err);

	return res.status(error.status).json({
		error: { code: error.code, message: error.message },
	});
};
