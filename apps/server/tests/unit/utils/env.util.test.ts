import { afterEach, describe, expect, it, vi } from "vitest";
import { readEnv, readSecret } from "@/utils/env.util";
import { readFileSync } from "fs";

vi.mock("fs", () => ({
	readFileSync: vi.fn(),
}));

describe("/utils/env.util", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	describe("readEnv", () => {
		it("Returns an environment variable when it contains a value", () => {
			// Arrange
			vi.stubEnv("TEST_VALUE", "configured-value");

			// Act
			const result = readEnv("TEST_VALUE");

			// Assert
			expect(result).toBe("configured-value");
		});

		it("Returns undefined when the environment variable does not exist", () => {
			// Arrange
			vi.stubEnv("TEST_VALUE", undefined);

			// Act
			const result = readEnv("TEST_VALUE");

			// Assert
			expect(result).toBeUndefined();
		});

		it("Returns undefined when the environment variable is empty", () => {
			// Arrange
			vi.stubEnv("TEST_VALUE", "	 ");

			// Act
			const result = readEnv("TEST_VALUE");

			// Assert
			expect(result).toBeUndefined();
		});

		it("Returns the original value when the environment variable has surrounding spaces", () => {
			// Arrange
			vi.stubEnv("TEST_VALUE", "	configured-value	");

			// Act
			const result = readEnv("TEST_VALUE");

			// Assert
			expect(result).toBe("	configured-value	");
		});
	});

	describe("readSecret", () => {
		it("Returns the trimmed secret when the secret file exists", () => {
			// Arrange
			const readFileSyncMock = vi.mocked(readFileSync);
			readFileSyncMock.mockReturnValue("secret-value \n");

			// Act
			const result = readSecret("jwt_secret");

			// Assert
			expect(readFileSync).toHaveBeenCalled();
			expect(readFileSync).toHaveBeenCalledWith(
				"/run/secrets/jwt_secret",
				"utf-8",
			);
			expect(result).toBe("secret-value");
		});

		it("Returns undefined when the secret file cannot be read", () => {
			// Arrange
			const readFileSyncMock = vi.mocked(readFileSync);
			readFileSyncMock.mockImplementation(() => {
				throw new Error("File not found");
			});

			// Act
			const result = readSecret("missing_secret");

			// Assert
			expect(result).toBeUndefined();
		});
	});
});
