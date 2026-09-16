import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	requireAuth,
	requireGuest,
	requireUserOwnership,
} from "@/middlewares/auth.middleware";
import { validateAccessToken } from "@/utils/jwt.util";

vi.mock("@/utils/jwt.util", () => ({
	validateAccessToken: vi.fn(),
}));

const mockedValidateAccessToken = vi.mocked(validateAccessToken);

describe("middlewares/auth.middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("requireGuest", () => {
		it("Calls next without an error when no token exists", () => {
			// Arrange
			const req = {
				cookies: {},
			} as any;
			const next = vi.fn();

			// Act
			requireGuest(req, {} as any, next);

			// Assert
			expect(next).toHaveBeenCalledOnce();
			expect(next).toHaveBeenCalledWith();
		});

		it("Calls next with AlreadyAuthError when the token is valid", () => {
			// Arrange
			mockedValidateAccessToken.mockReturnValue({
				sub: "user-uuid",
			} as any);

			const req = {
				cookies: {
					token: "valid-token",
				},
			} as any;
			const next = vi.fn();

			// Act
			requireGuest(req, {} as any, next);

			// Assert
			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "AlreadyAuthError",
			});
		});

		it("Calls next without an error when the token is invalid", () => {
			// Arrange
			mockedValidateAccessToken.mockImplementation(() => {
				throw new Error("Invalid token");
			});

			const req = {
				cookies: {
					token: "invalid-token",
				},
			} as any;
			const next = vi.fn();

			// Act
			requireGuest(req, {} as any, next);

			// Assert
			expect(next).toHaveBeenCalledWith();
		});
	});

	describe("requireAuth", () => {
		it("Calls next with RequireAuthError when no token exists", () => {
			// Arrange
			const req = {
				cookies: {},
			} as any;
			const next = vi.fn();

			// Act
			requireAuth(req, {} as any, next);

			// Assert
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
		});

		it("Calls next without an error when the token is valid", () => {
			// Arrange
			mockedValidateAccessToken.mockReturnValue({
				sub: "user-uuid",
			} as any);

			const req = {
				cookies: {
					token: "valid-token",
				},
			} as any;
			const next = vi.fn();

			// Act
			requireAuth(req, {} as any, next);

			// Assert
			expect(next).toHaveBeenCalledWith();
		});

		it("Calls next with RequireAuthError when the token is invalid", () => {
			// Arrange
			mockedValidateAccessToken.mockImplementation(() => {
				throw new Error("Invalid token");
			});

			const req = {
				cookies: {
					token: "invalid-token",
				},
			} as any;
			const next = vi.fn();

			// Act
			requireAuth(req, {} as any, next);

			// Assert
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
		});
	});

	describe("requireUserOwnership", () => {
		it("Calls next with RequireAuthError when no token exists", () => {
			// Arrange
			const req = {
				cookies: {},
				params: {
					uuid: "user-uuid",
				},
			} as any;
			const next = vi.fn();

			// Act
			requireUserOwnership(req, {} as any, next);

			// Assert
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
		});

		it("Calls next without an error when the token belongs to the requested user", () => {
			// Arrange
			mockedValidateAccessToken.mockReturnValue({
				sub: "user-uuid",
			} as any);

			const req = {
				cookies: {
					token: "valid-token",
				},
				params: {
					uuid: "user-uuid",
				},
			} as any;
			const next = vi.fn();

			// Act
			requireUserOwnership(req, {} as any, next);

			// Assert
			expect(next).toHaveBeenCalledWith();
		});

		it("Calls next with CannotEditUserError when the token belongs to another user", () => {
			// Arrange
			mockedValidateAccessToken.mockReturnValue({
				sub: "another-user-uuid",
			} as any);

			const req = {
				cookies: {
					token: "valid-token",
				},
				params: {
					uuid: "user-uuid",
				},
			} as any;
			const next = vi.fn();

			// Act
			requireUserOwnership(req, {} as any, next);

			// Assert
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "CannotEditUserError",
			});
		});

		it("Calls next with RequireAuthError when the token is invalid", () => {
			// Arrange
			mockedValidateAccessToken.mockImplementation(() => {
				throw new Error("Invalid token");
			});

			const req = {
				cookies: {
					token: "invalid-token",
				},
				params: {
					uuid: "user-uuid",
				},
			} as any;
			const next = vi.fn();

			// Act
			requireUserOwnership(req, {} as any, next);

			// Assert
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
		});
	});
});
