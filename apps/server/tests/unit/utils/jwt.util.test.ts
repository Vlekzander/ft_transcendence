import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateAccessToken, validateAccessToken } from "@/utils/jwt.util";
import { AppDomainError, InvalidJWTError } from "@/errors";
import * as envUtil from "@/utils/env.util";

describe("utils/jwt.util", () => {
	// A valid v4 UUID to satisfy Zod schema validation
	const validUuid = "123e4567-e89b-12d3-a456-426614174000";

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	describe("generateAccessToken", () => {
		it("Generates a token containing the user UUID when JWT_SECRET is in env", () => {
			// Arrange
			vi.stubEnv("JWT_SECRET", "test-secret");

			// Act
			const result = generateAccessToken(validUuid);

			// Assert
			expect(result).toEqual(expect.any(String));
			expect(result.split(".")).toHaveLength(3);
		});

		it("Generates a token using readSecret when secret file exists", () => {
			// Arrange
			vi.spyOn(envUtil, "readSecret").mockReturnValue("docker-secret");

			// Act
			const result = generateAccessToken(validUuid);

			// Assert
			expect(result).toEqual(expect.any(String));
			expect(result.split(".")).toHaveLength(3);
		});

		it("Throws an error when providing an invalid UUID format", () => {
			// Arrange
			vi.stubEnv("JWT_SECRET", "test-secret");
			const invalidUuid = "not-a-uuid";

			// Act
			const action = () => generateAccessToken(invalidUuid);

			// Assert
			expect(action).toThrow(); // Throws due to Zod validation error
		});

		it("Throws an error when the JWT secret is missing", () => {
			// Arrange
			vi.spyOn(envUtil, "readSecret").mockReturnValue(undefined);
			vi.stubEnv("JWT_SECRET", "");

			// Act
			const action = () => generateAccessToken(validUuid);

			// Assert
			expect(action).toThrow("JWT secret is missing");
		});
	});

	describe("validateAccessToken", () => {
		it("Returns the payload of a valid token", () => {
			// Arrange
			vi.stubEnv("JWT_SECRET", "test-secret");
			const token = generateAccessToken(validUuid);

			// Act
			const result = validateAccessToken(token);

			// Assert
			expect(result).toMatchObject({
				sub: validUuid,
			});
		});

		it("Throws InvalidJWTError when the token has an invalid UUID inside sub", () => {
			// Arrange
			vi.stubEnv("JWT_SECRET", "test-secret");
			// Manually sign a token with a non-UUID sub to test Zod validation on decode
			const jwt = require("jsonwebtoken");
			const maliciousToken = jwt.sign(
				{ sub: "not-a-uuid" },
				"test-secret",
			);

			// Act
			const action = () => validateAccessToken(maliciousToken);

			// Assert
			expect(action).toThrowError(InvalidJWTError);
		});

		it("Throws InvalidJWTError when the token is invalid or expired", () => {
			// Arrange
			vi.stubEnv("JWT_SECRET", "test-secret");

			// Act
			const action = () => validateAccessToken("invalid-token");

			// Assert
			expect(action).toThrowError(InvalidJWTError);
		});

		it("Throws an error when the JWT secret is missing during validation", () => {
			// Arrange
			vi.spyOn(envUtil, "readSecret").mockReturnValue(undefined);
			vi.stubEnv("JWT_SECRET", "");

			// Act
			const action = () => validateAccessToken("any-token");

			// Assert
			expect(action).toThrow("JWT secret is missing");
		});
	});
});
