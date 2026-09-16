import { describe, expect, it, vi } from "vitest";
import { AppDomainError, ValidationError } from "@ft_transcendence/shared";
import {
	AlreadyAuthError,
	CannotEditUserError,
	DuplicateElementError,
	InvalidElementError,
	RequireAuthError,
	UnknownUserIdError,
} from "@/errors";
import { errorHandler, mapError } from "@/middlewares/errorHandler.middleware";

describe("middlewares/errorHandler.middleware", () => {
	describe("mapError", () => {
		it("Maps DuplicateElementError to HTTP 409", () => {
			// Arrange
			const error = new DuplicateElementError("email");

			// Act
			const result = mapError(error);

			// Assert
			expect(result).toEqual({
				status: 409,
				code: error.name,
				message: error.message,
			});
		});

		it("Maps InvalidElementError to HTTP 400", () => {
			// Arrange
			const error = new InvalidElementError("email");

			// Act
			const result = mapError(error);

			// Assert
			expect(result.status).toBe(400);
			expect(result.code).toBe(error.name);
		});

		it("Maps UnknownUserIdError to HTTP 404", () => {
			// Arrange
			const error = new UnknownUserIdError();

			// Act
			const result = mapError(error);

			// Assert
			expect(result.status).toBe(404);
			expect(result.code).toBe(error.name);
		});

		it("Maps ValidationError to HTTP 400", () => {
			// Arrange
			const error = new ValidationError("email", "Invalid email");

			// Act
			const result = mapError(error);

			// Assert
			expect(result.status).toBe(400);
			expect(result.code).toBe(error.name);
		});

		it("Maps SyntaxError to HTTP 400", () => {
			// Arrange
			const error = new SyntaxError("Invalid JSON");

			// Act
			const result = mapError(error);

			// Assert
			expect(result).toEqual({
				status: 400,
				code: error.name,
				message: error.message,
			});
		});

		it("Maps AlreadyAuthError to HTTP 403", () => {
			// Arrange
			const error = new AlreadyAuthError();

			// Act
			const result = mapError(error);

			// Assert
			expect(result.status).toBe(403);
			expect(result.code).toBe(error.name);
		});

		it("Maps RequireAuthError to HTTP 401", () => {
			// Arrange
			const error = new RequireAuthError();

			// Act
			const result = mapError(error);

			// Assert
			expect(result.status).toBe(401);
			expect(result.code).toBe(error.name);
		});

		it("Maps CannotEditUserError to HTTP 403", () => {
			// Arrange
			const error = new CannotEditUserError();

			// Act
			const result = mapError(error);

			// Assert
			expect(result.status).toBe(403);
			expect(result.code).toBe(error.name);
		});

		it("Maps AppDomainError to HTTP 400", () => {
			// Arrange
			const error = new AppDomainError("Domain error");

			// Act
			const result = mapError(error);

			// Assert
			expect(result).toEqual({
				status: 400,
				code: error.name,
				message: error.message,
			});
		});

		it("Maps unknown errors to the internal server error response", () => {
			// Arrange
			const error = new Error("Database failure");

			// Act
			const result = mapError(error);

			// Assert
			expect(result).toEqual({
				status: 500,
				code: "InternalServerError",
				message: "Internal server error",
			});
		});
	});

	describe("errorHandler", () => {
		it("Sends the mapped error response when headers were not sent", () => {
			// Arrange
			const error = new RequireAuthError();
			const status = vi.fn().mockReturnThis();
			const json = vi.fn();

			const res = {
				headersSent: false,
				status,
				json,
			} as any;

			const next = vi.fn();

			// Act
			errorHandler(error, {} as any, res, next);

			// Assert
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
			// Arrange
			const error = new Error("Headers already sent");
			const res = {
				headersSent: true,
			} as any;
			const next = vi.fn();

			// Act
			errorHandler(error, {} as any, res, next);

			// Assert
			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
