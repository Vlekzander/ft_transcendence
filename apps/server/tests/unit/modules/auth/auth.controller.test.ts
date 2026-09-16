import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	login,
	logout,
	register,
	whoami,
} from "@/modules/auth/auth.controller";
import { authService } from "@/modules/auth/auth.service";
import { sharedService } from "@/modules/shared/shared.service";
import { generateAccessToken, validateAccessToken } from "@/utils/jwt.util";
import { toUserResponseDTO } from "@/modules/auth/auth.mapper";

vi.mock("@/modules/auth/auth.service", () => ({
	authService: {
		register: vi.fn(),
		login: vi.fn(),
	},
}));

vi.mock("@/modules/shared/shared.service", () => ({
	sharedService: {
		getUserById: vi.fn(),
	},
}));

vi.mock("@/utils/jwt.util", () => ({
	generateAccessToken: vi.fn(),
	validateAccessToken: vi.fn(),
	JWT_MAX_AGE: 604800000,
}));

vi.mock("@/modules/auth/auth.mapper", () => ({
	toUserResponseDTO: vi.fn(),
}));

const mockedRegister = vi.mocked(authService.register);
const mockedLogin = vi.mocked(authService.login);
const mockedGetUserById = vi.mocked(sharedService.getUserById);
const mockedGenerateAccessToken = vi.mocked(generateAccessToken);
const mockedValidateAccessToken = vi.mocked(validateAccessToken);
const mockedToUserResponseDTO = vi.mocked(toUserResponseDTO);

const user = {
	uuid: "user-uuid",
	email: "user@email.com",
	username: "user",
	avatarPath: null,
	createdAt: new Date("2026-01-01"),
};

const userDTO = {
	uuid: "user-uuid",
	email: "user@email.com",
	username: "user",
	avatarPath: null,
};

function createResponseMock() {
	const res = {
		cookie: vi.fn(),
		clearCookie: vi.fn(),
		status: vi.fn(),
		json: vi.fn(),
		sendStatus: vi.fn(),
	};

	res.status.mockReturnValue(res);
	res.json.mockReturnValue(res);
	res.sendStatus.mockReturnValue(res);

	return res;
}

describe("auth/auth.controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedToUserResponseDTO.mockReturnValue(userDTO);
		mockedGenerateAccessToken.mockReturnValue("access-token");
	});

	describe("register", () => {
		it("Registers the user and returns HTTP 201", async () => {
			// Arrange
			mockedRegister.mockResolvedValue(user as any);

			const req = {
				parsedBody: {
					email: "user@email.com",
					username: "user",
					password: "password",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await register(req, res as any, next);

			// Assert
			expect(mockedRegister).toHaveBeenCalledWith(req.parsedBody);
			expect(mockedToUserResponseDTO).toHaveBeenCalledWith(user);
			expect(mockedGenerateAccessToken).toHaveBeenCalledWith("user-uuid");
			expect(res.cookie).toHaveBeenCalledWith(
				"token",
				"access-token",
				expect.objectContaining({
					httpOnly: true,
					sameSite: "strict",
				}),
			);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({
				data: userDTO,
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Forwards service errors to next", async () => {
			// Arrange
			const error = new Error("Registration failed");
			mockedRegister.mockRejectedValue(error);

			const req = {
				parsedBody: {
					email: "user@email.com",
					username: "user",
					password: "password",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await register(req, res as any, next);

			// Assert
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("login", () => {
		it("Logs in the user and returns HTTP 200", async () => {
			// Arrange
			mockedLogin.mockResolvedValue(user as any);

			const req = {
				parsedBody: {
					username: "user",
					password: "password",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await login(req, res as any, next);

			// Assert
			expect(mockedLogin).toHaveBeenCalledWith(req.parsedBody);
			expect(mockedToUserResponseDTO).toHaveBeenCalledWith(user);
			expect(mockedGenerateAccessToken).toHaveBeenCalledWith("user-uuid");
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				data: userDTO,
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Forwards authentication errors to next", async () => {
			// Arrange
			const error = new Error("Invalid credentials");
			mockedLogin.mockRejectedValue(error);

			const req = {
				parsedBody: {
					username: "user",
					password: "wrong-password",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await login(req, res as any, next);

			// Assert
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("logout", () => {
		it("Clears the token cookie and returns HTTP 204", async () => {
			// Arrange
			const res = createResponseMock();

			// Act
			await logout({} as any, res as any);

			// Assert
			expect(res.clearCookie).toHaveBeenCalledWith(
				"token",
				expect.objectContaining({
					httpOnly: true,
					sameSite: "strict",
				}),
			);
			expect(res.sendStatus).toHaveBeenCalledWith(204);
		});
	});

	describe("whoami", () => {
		it("Returns unauthenticated when no token exists", async () => {
			// Arrange
			const req = {
				cookies: {},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await whoami(req, res as any, next);

			// Assert
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				authenticated: false,
			});
			expect(mockedValidateAccessToken).not.toHaveBeenCalled();
		});

		it("Returns unauthenticated when the token user does not exist", async () => {
			// Arrange
			mockedValidateAccessToken.mockReturnValue({
				sub: "unknown-uuid",
			} as any);
			mockedGetUserById.mockResolvedValue(null);

			const req = {
				cookies: {
					token: "access-token",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await whoami(req, res as any, next);

			// Assert
			expect(mockedValidateAccessToken).toHaveBeenCalledWith(
				"access-token",
			);
			expect(mockedGetUserById).toHaveBeenCalledWith("unknown-uuid");
			expect(res.json).toHaveBeenCalledWith({
				authenticated: false,
			});
		});

		it("Returns the authenticated user when the token is valid", async () => {
			// Arrange
			mockedValidateAccessToken.mockReturnValue({
				sub: "user-uuid",
			} as any);
			mockedGetUserById.mockResolvedValue(user as any);

			const req = {
				cookies: {
					token: "access-token",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await whoami(req, res as any, next);

			// Assert
			expect(mockedGetUserById).toHaveBeenCalledWith("user-uuid");
			expect(mockedToUserResponseDTO).toHaveBeenCalledWith(user);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				authenticated: true,
				user: userDTO,
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Forwards token validation errors to next", async () => {
			// Arrange
			const error = new Error("Invalid token");
			mockedValidateAccessToken.mockImplementation(() => {
				throw error;
			});

			const req = {
				cookies: {
					token: "invalid-token",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await whoami(req, res as any, next);

			// Assert
			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
