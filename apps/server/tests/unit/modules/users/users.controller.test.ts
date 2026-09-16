import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getUser,
	getUserAchievements,
	getUserFriends,
	getUserHistory,
	getUserStats,
	updateAvatar,
	updateUser,
} from "@/modules/users/users.controller";
import { sharedService } from "@/modules/shared/shared.service";
import { usersService } from "@/modules/users/users.service";
import {
	toPublicUserDTO,
	toUserResponseDTO,
} from "@/modules/users/users.mapper";
import { AVATAR_DIR } from "@/config/upload.config";

vi.mock("@/modules/shared/shared.service", () => ({
	sharedService: {
		getUserById: vi.fn(),
		validateUserPassword: vi.fn(),
	},
}));

vi.mock("@/modules/users/users.service", () => ({
	usersService: {
		getUserHistory: vi.fn(),
		updateUser: vi.fn(),
		updateUserAvatar: vi.fn(),
	},
}));

vi.mock("@/modules/users/users.mapper", () => ({
	toPublicUserDTO: vi.fn(),
	toUserResponseDTO: vi.fn(),
}));

const mockedGetUserById = vi.mocked(sharedService.getUserById);
const mockedValidateUserPassword = vi.mocked(
	sharedService.validateUserPassword,
);
const mockedGetUserHistory = vi.mocked(usersService.getUserHistory);
const mockedUpdateUser = vi.mocked(usersService.updateUser);
const mockedUpdateUserAvatar = vi.mocked(usersService.updateUserAvatar);
const mockedToPublicUserDTO = vi.mocked(toPublicUserDTO);
const mockedToUserResponseDTO = vi.mocked(toUserResponseDTO);

const user = {
	uuid: "user-uuid",
	email: "user@email.com",
	username: "user",
	avatarPath: null,
	createdAt: new Date("2026-01-01"),
};

const publicUserDTO = {
	uuid: "user-uuid",
	username: "user",
	avatarPath: null,
	online: false,
};

const userResponseDTO = {
	uuid: "user-uuid",
	email: "user@email.com",
	username: "user",
	avatarPath: null,
};

function createResponseMock() {
	const res = {
		status: vi.fn(),
		json: vi.fn(),
	};

	res.status.mockReturnValue(res);
	res.json.mockReturnValue(res);

	return res;
}

describe("users/users.controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockedToPublicUserDTO.mockReturnValue(publicUserDTO);
		mockedToUserResponseDTO.mockReturnValue(userResponseDTO);
	});

	describe("getUser", () => {
		it("Returns a public user with HTTP 200", async () => {
			// Arrange
			mockedGetUserById.mockResolvedValue(user as any);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await getUser(req, res as any, next);

			// Assert
			expect(mockedGetUserById).toHaveBeenCalledWith("user-uuid");
			expect(mockedToPublicUserDTO).toHaveBeenCalledWith(user);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				user: publicUserDTO,
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Calls next with UnknownUserIdError when the user does not exist", async () => {
			// Arrange
			mockedGetUserById.mockResolvedValue(null);

			const req = {
				parsedParams: {
					uuid: "unknown-uuid",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await getUser(req, res as any, next);

			// Assert
			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "UnknownUserIdError",
			});
			expect(res.status).not.toHaveBeenCalled();
		});

		it("Forwards service errors to next", async () => {
			// Arrange
			const error = new Error("Database unavailable");
			mockedGetUserById.mockRejectedValue(error);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await getUser(req, res as any, next);

			// Assert
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("getUserHistory", () => {
		it("Returns user history with HTTP 200", async () => {
			// Arrange
			const history = [
				{
					uuid: "game-uuid",
					mode: "CLASSIC",
					finished: true,
					duration: 120,
					participants: [],
				},
			];

			mockedGetUserHistory.mockResolvedValue(history as any);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await getUserHistory(req, res as any, next);

			// Assert
			expect(mockedGetUserHistory).toHaveBeenCalledWith("user-uuid");
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				history,
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Forwards history service errors to next", async () => {
			// Arrange
			const error = new Error("History unavailable");
			mockedGetUserHistory.mockRejectedValue(error);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await getUserHistory(req, res as any, next);

			// Assert
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("getUserStats", () => {
		it("Returns the user statistics with HTTP 200", async () => {
			// Arrange
			const req = {} as any;
			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await getUserStats(req, res as any, next);

			// Assert
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				stats: [
					{
						icon: "gamepad-2",
						label: "Game Played",
						value: "193",
					},
					{
						icon: "trophy",
						label: "Wins",
						value: "42",
					},
					{
						icon: "lightbulb",
						label: "Words Guessed",
						value: "1247",
					},
					{
						icon: "pencil-line",
						label: "Drawings",
						value: "251",
					},
					{
						icon: "star",
						label: "Best score",
						value: "520",
					},
				],
			});
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("getUserAchievements", () => {
		it("Returns three achievements with HTTP 200", async () => {
			// Arrange
			const req = {} as any;
			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await getUserAchievements(req, res as any, next);

			// Assert
			expect(res.status).toHaveBeenCalledWith(200);

			const response = res.json.mock.calls[0][0];

			expect(response.achievements).toHaveLength(3);
			expect(response.achievements).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						icon: "flame",
						title: "aaa",
						description: "bbb",
						objective: 13,
						current: 1,
					}),
					expect.objectContaining({
						icon: "zap",
						title: "ccc",
						description: "ddd",
						objective: 100,
						current: 57,
					}),
					expect.objectContaining({
						icon: "user",
						title: "Blablablabla",
						description: "blibliblibli",
						objective: 38,
						current: 192,
					}),
				]),
			);
			expect(next).not.toHaveBeenCalled();
		});

		it("Generates a UUID for every achievement", async () => {
			// Arrange
			const req = {} as any;
			const res = createResponseMock();

			// Act
			await getUserAchievements(req, res as any, vi.fn());

			// Assert
			const response = res.json.mock.calls[0][0];

			for (const achievement of response.achievements) {
				expect(achievement.uuid).toEqual(expect.any(String));
			}
		});
	});

	describe("getUserFriends", () => {
		it("Returns three friends with HTTP 200", async () => {
			// Arrange
			const req = {} as any;
			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await getUserFriends(req, res as any, next);

			// Assert
			expect(res.status).toHaveBeenCalledWith(200);

			const response = res.json.mock.calls[0][0];

			expect(response.friends).toHaveLength(3);
			expect(response.friends).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						status: "in_game",
					}),
					expect.objectContaining({
						status: "online",
					}),
					expect.objectContaining({
						status: "offline",
					}),
				]),
			);
			expect(next).not.toHaveBeenCalled();
		});

		it("Generates a UUID for every friend", async () => {
			// Arrange
			const req = {} as any;
			const res = createResponseMock();

			// Act
			await getUserFriends(req, res as any, vi.fn());

			// Assert
			const response = res.json.mock.calls[0][0];

			for (const friend of response.friends) {
				expect(friend.user.uuid).toEqual(expect.any(String));
			}
		});
	});

	describe("updateUser", () => {
		it("Updates the user when the current password is valid", async () => {
			// Arrange
			mockedValidateUserPassword.mockResolvedValue(true);
			mockedUpdateUser.mockResolvedValue(user as any);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
				parsedBody: {
					currentPassword: "current-password",
					confirmPassword: "new-password",
					username: "updated-user",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await updateUser(req, res as any, next);

			// Assert
			expect(mockedValidateUserPassword).toHaveBeenCalledWith(
				"user-uuid",
				"current-password",
			);
			expect(mockedUpdateUser).toHaveBeenCalledWith("user-uuid", {
				username: "updated-user",
			});
			expect(mockedToUserResponseDTO).toHaveBeenCalledWith(user);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				user: userResponseDTO,
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Calls next with InvalidCredentialsError when the current password is invalid", async () => {
			// Arrange
			mockedValidateUserPassword.mockResolvedValue(false);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
				parsedBody: {
					currentPassword: "wrong-password",
					confirmPassword: "new-password",
					username: "updated-user",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await updateUser(req, res as any, next);

			// Assert
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "InvalidCredentialsError",
			});
			expect(mockedUpdateUser).not.toHaveBeenCalled();
		});

		it("Forwards update errors to next", async () => {
			// Arrange
			const error = new Error("Update failed");

			mockedValidateUserPassword.mockResolvedValue(true);
			mockedUpdateUser.mockRejectedValue(error);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
				parsedBody: {
					currentPassword: "current-password",
					confirmPassword: "new-password",
					username: "updated-user",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await updateUser(req, res as any, next);

			// Assert
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("updateAvatar", () => {
		it("Updates the avatar and returns the user", async () => {
			// Arrange
			mockedUpdateUserAvatar.mockResolvedValue(user as any);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
				file: {
					path: `${AVATAR_DIR}/new-avatar.png`,
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await updateAvatar(req, res as any, next);

			// Assert
			expect(mockedUpdateUserAvatar).toHaveBeenCalledWith(
				"user-uuid",
				"new-avatar.png",
			);
			expect(mockedToUserResponseDTO).toHaveBeenCalledWith(user);
			expect(res.json).toHaveBeenCalledWith({
				user: userResponseDTO,
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Calls next with NoFileUploadError when no file was uploaded", async () => {
			// Arrange
			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
				file: undefined,
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await updateAvatar(req, res as any, next);

			// Assert
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "NoFileUploadError",
			});
			expect(mockedUpdateUserAvatar).not.toHaveBeenCalled();
		});

		it("Forwards avatar update errors to next", async () => {
			// Arrange
			const error = new Error("Avatar update failed");

			mockedUpdateUserAvatar.mockRejectedValue(error);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
				file: {
					path: `${AVATAR_DIR}/new-avatar.png`,
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			// Act
			await updateAvatar(req, res as any, next);

			// Assert
			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
