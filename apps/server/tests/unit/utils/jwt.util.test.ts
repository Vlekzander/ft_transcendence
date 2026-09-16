import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAccessToken, validateAccessToken } from "@/utils/jwt.util";

describe("utils/jwt.util", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("generateAccessToken", () => {
		it("Generates a token containing the user UUID", () => {
			// Arrange
			vi.stubEnv("JWT_SECRET", "test-secret");
			const uuid = "user-uuid";

			// Act
			const result = generateAccessToken(uuid);

			// Assert
			expect(result).toEqual(expect.any(String));
			expect(result.split(".")).toHaveLength(3);
		});

		it("Throws an error when the JWT secret is missing", () => {
			// Arrange
			vi.stubEnv("JWT_SECRET", undefined);

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

		it("Throws an error when the token is invalid", () => {
			// Arrange
			vi.stubEnv("JWT_SECRET", "test-secret");

			// Act
			const action = () => validateAccessToken("invalid-token");

			// Assert
			expect(action).toThrow();
		});

		it("Throws an error when the JWT secret is missing", () => {
			// Arrange
			vi.stubEnv("JWT_SECRET", undefined);

			// Act
			const action = () => validateAccessToken("any-token");

			// Assert
			expect(action).toThrow("JWT secret is missing");
		});
	});
});
