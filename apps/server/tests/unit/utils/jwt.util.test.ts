import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateAccessToken, validateAccessToken } from "@/utils/jwt.util";
import { InvalidJWTError } from "@/errors";
import * as envUtil from "@/utils/env.util";

describe("utils/jwt.util", () => {
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
			const uuid = "user-uuid";

			// Act
			const result = generateAccessToken(uuid);

			// Assert
			expect(result).toEqual(expect.any(String));
			expect(result.split(".")).toHaveLength(3);
		});

		it("Generates a token using readSecret when secret file exists", () => {
			// Arrange
			vi.spyOn(envUtil, "readSecret").mockReturnValue("docker-secret");
			const uuid = "user-uuid";

			// Act
			const result = generateAccessToken(uuid);

			// Assert
			expect(result).toEqual(expect.any(String));
			expect(result.split(".")).toHaveLength(3);
		});

		it("Throws an error when the JWT secret is missing", () => {
			// Arrange
			vi.spyOn(envUtil, "readSecret").mockReturnValue(undefined);
			vi.stubEnv("JWT_SECRET", "");

			// Act
			const action = () => generateAccessToken("user-uuid");

			// Assert
			expect(action).toThrow("JWT secret is missing");
		});
	});

	describe("validateAccessToken", () => {
		it("Returns the payload of a valid token", () => {
			// Arrange
			vi.stubEnv("JWT_SECRET", "test-secret");
			const token = generateAccessToken("user-uuid");

			// Act
			const result = validateAccessToken(token);

			// Assert
			expect(result).toMatchObject({
				sub: "user-uuid",
			});
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
