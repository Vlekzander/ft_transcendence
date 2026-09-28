import { describe, expect, it, vi } from "vitest";
import { AppDomainError, ValidationError } from "@ft_transcendence/shared";
import {
	AlreadyAuthError,
	CannotEditUserError,
	DuplicateElementError,
	DuplicateEmailError,
	DuplicateUsernameError,
	FriendshipAlreadyExistError,
	InvalidCredentialsError,
	InvalidElementError,
	InvalidFileSizeError,
	InvalidFileTypeError,
	InvalidIdError,
	InvalidJWTError,
	NoFileUploadError,
	PendingFriendRequestExistError,
	RequireAuthError,
	SelfFriendRequestError,
	UnknownElementError,
	UnknownFriendRequestError,
	UnknownUserIdError,
} from "@/errors";
import { errorHandler, mapError } from "@/middlewares/errorHandler.middleware";

describe("middlewares/errorHandler.middleware", () => {
	describe("mapError", () => {
		it("Maps DuplicateElementError and subclasses to HTTP 409", () => {
			const error = new DuplicateElementError("email");
			const emailError = new DuplicateEmailError();
			const usernameError = new DuplicateUsernameError();

			expect(mapError(error)).toEqual({
				status: 409,
				code: error.name,
				message: error.message,
			});
			expect(mapError(emailError).status).toBe(409);
			expect(mapError(usernameError).status).toBe(409);
		});

		it("Maps InvalidElementError and subclasses to HTTP 400", () => {
			const error = new InvalidElementError("field");
			const idError = new InvalidIdError();
			const jwtError = new InvalidJWTError();

			expect(mapError(error).status).toBe(400);
			expect(mapError(idError).status).toBe(400);
			expect(mapError(jwtError).status).toBe(400);
		});

		it("Maps UnknownUserIdError to HTTP 404", () => {
			const error = new UnknownUserIdError();
			const result = mapError(error);

			expect(result.status).toBe(404);
			expect(result.code).toBe(error.name);
		});

		it("Maps ValidationError to HTTP 400", () => {
			const error = new ValidationError("email", "Invalid email");
			const result = mapError(error);

			expect(result.status).toBe(400);
			expect(result.code).toBe(error.name);
		});

		it("Maps SyntaxError to HTTP 400", () => {
			const error = new SyntaxError("Invalid JSON");
			const result = mapError(error);

			expect(result).toEqual({
				status: 400,
				code: error.name,
				message: error.message,
			});
		});

		it("Maps AlreadyAuthError to HTTP 403", () => {
			const error = new AlreadyAuthError();
			const result = mapError(error);

			expect(result.status).toBe(403);
			expect(result.code).toBe(error.name);
		});

		it("Maps RequireAuthError to HTTP 401", () => {
			const error = new RequireAuthError();
			const result = mapError(error);

			expect(result.status).toBe(401);
			expect(result.code).toBe(error.name);
		});

		it("Maps CannotEditUserError to HTTP 403", () => {
			const error = new CannotEditUserError();
			const result = mapError(error);

			expect(result.status).toBe(403);
			expect(result.code).toBe(error.name);
		});

		it("Maps InvalidCredentialsError to HTTP 401", () => {
			const error = new InvalidCredentialsError();
			const result = mapError(error);

			expect(result.status).toBe(401);
			expect(result.code).toBe(error.name);
		});

		it("Maps generic AppDomainError and its subclasses to HTTP 400", () => {
			const baseDomainError = new AppDomainError("Domain error");
			const unknownElementError = new UnknownElementError("target");
			const unknownFriendRequest = new UnknownFriendRequestError();
			const noFileError = new NoFileUploadError();
			const invalidFileTypeError = new InvalidFileTypeError();
			const invalidFileSizeError = new InvalidFileSizeError(5);
			const selfFriendRequestError = new SelfFriendRequestError();
			const friendshipAlreadyExist = new FriendshipAlreadyExistError();
			const pendingFriendRequestExist =
				new PendingFriendRequestExistError();

			expect(mapError(baseDomainError).status).toBe(400);
			expect(mapError(unknownElementError).status).toBe(400);
			expect(mapError(unknownFriendRequest).status).toBe(400);
			expect(mapError(noFileError).status).toBe(400);
			expect(mapError(invalidFileTypeError).status).toBe(400);
			expect(mapError(invalidFileSizeError).status).toBe(400);
			expect(mapError(selfFriendRequestError).status).toBe(400);
			expect(mapError(friendshipAlreadyExist).status).toBe(400);
			expect(mapError(pendingFriendRequestExist).status).toBe(400);
		});

		it("Maps unknown errors to the internal server error response", () => {
			const consoleError = vi
				.spyOn(console, "error")
				.mockImplementation(() => undefined);
			const error = new Error("Database failure");

			const result = mapError(error);

			expect(result).toEqual({
				status: 500,
				code: "InternalServerError",
				message: "Internal server error",
			});
			expect(consoleError).toHaveBeenCalled();
		});
	});

	describe("errorHandler", () => {
		it("Sends the mapped error response when headers were not sent", () => {
			const error = new RequireAuthError();
			const status = vi.fn().mockReturnThis();
			const json = vi.fn();

			const res = {
				headersSent: false,
				status,
				json,
			} as any;

			const next = vi.fn();

			errorHandler(error, {} as any, res, next);

			expect(status).toHaveBeenCalledWith(401);
			expect(json).toHaveBeenCalledWith({
				error: {
					code: error.name,
					message: error.message,
				},
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Forwards the error when headers were already sent", () => {
			const error = new Error("Headers already sent");
			const res = {
				headersSent: true,
			} as any;
			const next = vi.fn();

			errorHandler(error, {} as any, res, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
