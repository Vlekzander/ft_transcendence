import { describe, expect, it } from "vitest";
import { compareHash, generateHash } from "@/utils/hash.util";

describe("utils/hash.util", () => {
	describe("generateHash", () => {
		it("Generates a hash different from the original value", async () => {
			// Arrange
			const value = "password";

			// Act
			const result = await generateHash(value);

			// Assert
			expect(result).not.toBe(value);
			expect(result).toEqual(expect.any(String));
		});

		it("Generates a hash that can be compared with the original value", async () => {
			// Arrange
			const value = "password";

			// Act
			const hash = await generateHash(value);
			const result = await compareHash(value, hash);

			// Assert
			expect(result).toBe(true);
		});
	});

	describe("compareHash", () => {
		it("Returns true when the value matches the hash", async () => {
			// Arrange
			const value = "password";
			const hash = await generateHash(value);

			// Act
			const result = await compareHash(value, hash);

			// Assert
			expect(result).toBe(true);
		});

		it("Returns false when the value does not match the hash", async () => {
			// Arrange
			const hash = await generateHash("password");

			// Act
			const result = await compareHash("wrong-password", hash);

			// Assert
			expect(result).toBe(false);
		});
	});
});
