import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validate } from "@/middlewares/validate.middleware";
import { ValidationError } from "@ft_transcendence/shared";

describe("middlewares/validate.middleware", () => {
	it("Stores the parsed body and calls next without an error", () => {
		// Arrange
		const schema = z.object({
			username: z.string(),
			age: z.coerce.number(),
		});

		const req = {
			body: {
				username: "user",
				age: "25",
			},
			params: {},
			query: {},
		} as any;

		const next = vi.fn();

		// Act
		validate({ body: schema })(req, {} as any, next);

		// Assert
		expect(req.parsedBody).toEqual({
			username: "user",
			age: 25,
		});
		expect(next).toHaveBeenCalledWith();
	});

	it("Stores the parsed params and calls next without an error", () => {
		// Arrange
		const schema = z.object({
			uuid: z.string().min(1),
		});

		const req = {
			body: {},
			params: {
				uuid: "user-uuid",
			},
			query: {},
		} as any;

		const next = vi.fn();

		// Act
		validate({ params: schema })(req, {} as any, next);

		// Assert
		expect(req.parsedParams).toEqual({
			uuid: "user-uuid",
		});
		expect(next).toHaveBeenCalledWith();
	});

	it("Stores the parsed query and calls next without an error", () => {
		// Arrange
		const schema = z.object({
			page: z.coerce.number(),
		});

		const req = {
			body: {},
			params: {},
			query: {
				page: "2",
			},
		} as any;

		const next = vi.fn();

		// Act
		validate({ query: schema })(req, {} as any, next);

		// Assert
		expect(req.parsedQuery).toEqual({
			page: 2,
		});
		expect(next).toHaveBeenCalledWith();
	});

	it("Calls next with ValidationError when the body is invalid", () => {
		// Arrange
		const schema = z.object({
			username: z.string().min(3),
		});

		const req = {
			body: {
				username: "us",
			},
			params: {},
			query: {},
		} as any;

		const next = vi.fn();

		// Act
		validate({ body: schema })(req, {} as any, next);

		// Assert
		expect(next).toHaveBeenCalledOnce();
		expect(next.mock.calls[0][0]).toMatchObject({
			name: "UsernameValidationError",
		});
		expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
	});

	it("Calls next with ValidationError when the params are invalid", () => {
		// Arrange
		const schema = z.object({
			uuid: z.string().min(1),
		});

		const req = {
			body: {},
			params: {},
			query: {},
		} as any;

		const next = vi.fn();

		// Act
		validate({ params: schema })(req, {} as any, next);

		// Assert
		expect(next.mock.calls[0][0]).toMatchObject({
			name: "UuidValidationError",
		});
		expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
	});

	it("Calls next with ValidationError when the query is invalid", () => {
		// Arrange
		const schema = z.object({
			page: z.coerce.number().positive(),
		});

		const req = {
			body: {},
			params: {},
			query: {
				page: "invalid",
			},
		} as any;

		const next = vi.fn();

		// Act
		validate({ query: schema })(req, {} as any, next);

		// Assert
		expect(next).toHaveBeenCalledOnce();
		expect(next.mock.calls[0][0]).toMatchObject({
			name: "PageValidationError",
		});
		expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
	});

	it("Validates the body, params, and query before calling next", () => {
		// Arrange
		const bodySchema = z.object({
			username: z.string(),
		});

		const paramsSchema = z.object({
			uuid: z.string(),
		});

		const querySchema = z.object({
			page: z.coerce.number(),
		});

		const req = {
			body: {
				username: "user",
			},
			params: {
				uuid: "user-uuid",
			},
			query: {
				page: "1",
			},
		} as any;

		const next = vi.fn();

		// Act
		validate({
			body: bodySchema,
			params: paramsSchema,
			query: querySchema,
		})(req, {} as any, next);

		// Assert
		expect(req.parsedBody).toEqual({
			username: "user",
		});
		expect(req.parsedParams).toEqual({
			uuid: "user-uuid",
		});
		expect(req.parsedQuery).toEqual({
			page: 1,
		});
		expect(next).toHaveBeenCalledWith();
	});
});
