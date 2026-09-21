import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	acceptFriendRequest,
	deleteFriendRequest,
	getFriends,
	getPendingFriendRequests,
	getUser,
	getUserAchievements,
	getUserHistory,
	getUserStats,
	sendFriendRequest,
	updateAvatar,
	updateUser,
} from "@/modules/users/users.controller";
import { sharedService } from "@/modules/shared/shared.service";
import { usersService } from "@/modules/users/users.service";
import {
	toFriendshipDTO,
	toPendingFriendRequestDTO,
	toSentFriendRequestDTO,
	toUserResponseDTO,
} from "@/modules/users/users.mapper";
import { toPublicUserDTO } from "@/modules/shared/shared.mapper";
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
		getFriendships: vi.fn(),
		getPendingFriendRequests: vi.fn(),
		sendFriendRequest: vi.fn(),
		acceptFriendRequest: vi.fn(),
		deleteFriendRequest: vi.fn(),
	},
}));

vi.mock("@/modules/users/users.mapper", () => ({
	toUserResponseDTO: vi.fn(),
	toFriendshipDTO: vi.fn(),
	toSentFriendRequestDTO: vi.fn(),
	toPendingFriendRequestDTO: vi.fn(),
}));

vi.mock("@/modules/shared/shared.mapper", () => ({
	toPublicUserDTO: vi.fn(),
}));

const mockedGetUserById = vi.mocked(sharedService.getUserById);
const mockedValidateUserPassword = vi.mocked(
	sharedService.validateUserPassword,
);
const mockedGetUserHistory = vi.mocked(usersService.getUserHistory);
const mockedUpdateUser = vi.mocked(usersService.updateUser);
const mockedUpdateUserAvatar = vi.mocked(usersService.updateUserAvatar);
const mockedGetFriendships = vi.mocked(usersService.getFriendships);
const mockedGetPendingFriendRequests = vi.mocked(
	usersService.getPendingFriendRequests,
);
const mockedSendFriendRequest = vi.mocked(usersService.sendFriendRequest);
const mockedAcceptFriendRequest = vi.mocked(usersService.acceptFriendRequest);
const mockedDeleteFriendRequest = vi.mocked(usersService.deleteFriendRequest);

const mockedToPublicUserDTO = vi.mocked(toPublicUserDTO);
const mockedToUserResponseDTO = vi.mocked(toUserResponseDTO);
const mockedToFriendshipDTO = vi.mocked(toFriendshipDTO);
const mockedToSentFriendRequestDTO = vi.mocked(toSentFriendRequestDTO);
const mockedToPendingFriendRequestDTO = vi.mocked(toPendingFriendRequestDTO);

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
		sendStatus: vi.fn(),
	};

	res.status.mockReturnValue(res);
	res.json.mockReturnValue(res);
	res.sendStatus.mockReturnValue(res);

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
			mockedGetUserById.mockResolvedValue(user as any);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await getUser(req, res as any, next);

			expect(mockedGetUserById).toHaveBeenCalledWith("user-uuid");
			expect(mockedToPublicUserDTO).toHaveBeenCalledWith(user);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				user: publicUserDTO,
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Calls next with UnknownUserIdError when the user does not exist", async () => {
			mockedGetUserById.mockResolvedValue(null);

			const req = {
				parsedParams: {
					uuid: "unknown-uuid",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await getUser(req, res as any, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "UnknownUserIdError",
			});
			expect(res.status).not.toHaveBeenCalled();
		});

		it("Forwards service errors to next", async () => {
			const error = new Error("Database unavailable");
			mockedGetUserById.mockRejectedValue(error);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await getUser(req, res as any, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("getUserHistory", () => {
		it("Returns user history with HTTP 200", async () => {
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

			await getUserHistory(req, res as any, next);

			expect(mockedGetUserHistory).toHaveBeenCalledWith("user-uuid");
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				history,
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Forwards history service errors to next", async () => {
			const error = new Error("History unavailable");
			mockedGetUserHistory.mockRejectedValue(error);

			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await getUserHistory(req, res as any, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("getUserStats", () => {
		it("Returns the user statistics with HTTP 200", async () => {
			const req = {} as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getUserStats(req, res as any, next);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				stats: expect.arrayContaining([
					expect.objectContaining({
						label: "Game Played",
						value: "193",
					}),
					expect.objectContaining({ label: "Wins", value: "42" }),
				]),
			});
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("getUserAchievements", () => {
		it("Returns achievements with UUIDs with HTTP 200", async () => {
			const req = {} as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getUserAchievements(req, res as any, next);

			expect(res.status).toHaveBeenCalledWith(200);
			const response = res.json.mock.calls[0][0];

			expect(response.achievements).toHaveLength(3);
			for (const achievement of response.achievements) {
				expect(achievement.uuid).toEqual(expect.any(String));
			}
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("updateUser", () => {
		it("Updates the user when current password is valid", async () => {
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

			await updateUser(req, res as any, next);

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

		it("Calls next with InvalidCredentialsError when current password is invalid", async () => {
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

			await updateUser(req, res as any, next);

			expect(next.mock.calls[0][0]).toMatchObject({
				name: "InvalidCredentialsError",
			});
			expect(mockedUpdateUser).not.toHaveBeenCalled();
		});
	});

	describe("updateAvatar", () => {
		it("Updates avatar and returns user with HTTP 200", async () => {
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

			await updateAvatar(req, res as any, next);

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

		it("Calls next with NoFileUploadError when file is missing", async () => {
			const req = {
				parsedParams: {
					uuid: "user-uuid",
				},
				file: undefined,
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await updateAvatar(req, res as any, next);

			expect(next.mock.calls[0][0]).toMatchObject({
				name: "NoFileUploadError",
			});
			expect(mockedUpdateUserAvatar).not.toHaveBeenCalled();
		});
	});

	describe("getFriends", () => {
		it("Returns friendships mapped to DTOs with HTTP 200", async () => {
			const rawFriendships = [{ uuid: "f-1", user }];
			const mappedFriendshipDTO = {
				uuid: "f-1",
				user: publicUserDTO,
			};

			mockedGetFriendships.mockResolvedValue(rawFriendships as any);
			mockedToFriendshipDTO.mockReturnValue(mappedFriendshipDTO as any);

			const req = {
				parsedParams: { uuid: "user-uuid" },
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await getFriends(req, res as any, next);

			expect(mockedGetFriendships).toHaveBeenCalledWith("user-uuid");
			expect(mockedToFriendshipDTO).toHaveBeenCalledWith(
				rawFriendships[0],
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				friends: [mappedFriendshipDTO],
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("Forwards errors to next", async () => {
			const error = new Error("Friendship query failed");
			mockedGetFriendships.mockRejectedValue(error);

			const req = {
				parsedParams: { uuid: "user-uuid" },
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await getFriends(req, res as any, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("getPendingFriendRequests", () => {
		it("Returns pending requests mapped to DTOs with HTTP 200", async () => {
			const rawRequests = [{ uuid: "req-1", sender: user }];
			const mappedRequestDTO = { uuid: "req-1", sender: publicUserDTO };

			mockedGetPendingFriendRequests.mockResolvedValue(
				rawRequests as any,
			);
			mockedToPendingFriendRequestDTO.mockReturnValue(
				mappedRequestDTO as any,
			);

			const req = {
				parsedParams: { uuid: "user-uuid" },
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await getPendingFriendRequests(req, res as any, next);

			expect(mockedGetPendingFriendRequests).toHaveBeenCalledWith(
				"user-uuid",
			);
			expect(mockedToPendingFriendRequestDTO).toHaveBeenCalledWith(
				rawRequests[0],
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				pendingRequests: [mappedRequestDTO],
			});
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("sendFriendRequest", () => {
		it("Sends friend request and returns sentRequest with HTTP 200", async () => {
			const createdRequest = { uuid: "req-1", receiver: user };
			const mappedSentDTO = { uuid: "req-1", receiver: publicUserDTO };

			mockedSendFriendRequest.mockResolvedValue(createdRequest as any);
			mockedToSentFriendRequestDTO.mockReturnValue(mappedSentDTO as any);

			const req = {
				parsedParams: { uuid: "user-uuid" },
				parsedBody: { receiverId: "receiver-uuid" },
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await sendFriendRequest(req, res as any, next);

			expect(mockedSendFriendRequest).toHaveBeenCalledWith(
				"user-uuid",
				"receiver-uuid",
			);
			expect(mockedToSentFriendRequestDTO).toHaveBeenCalledWith(
				createdRequest,
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				sentRequest: mappedSentDTO,
			});
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("acceptFriendRequest", () => {
		it("Accepts friend request and returns friend with HTTP 200", async () => {
			const accepted = { uuid: "f-1", user };
			const mappedFriendDTO = { uuid: "f-1", user: publicUserDTO };

			mockedAcceptFriendRequest.mockResolvedValue(accepted as any);
			mockedToFriendshipDTO.mockReturnValue(mappedFriendDTO as any);

			const req = {
				parsedParams: { uuid: "user-uuid" },
				parsedBody: { requestId: "req-uuid" },
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await acceptFriendRequest(req, res as any, next);

			expect(mockedAcceptFriendRequest).toHaveBeenCalledWith(
				"user-uuid",
				"req-uuid",
			);
			expect(mockedToFriendshipDTO).toHaveBeenCalledWith(accepted);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				friend: mappedFriendDTO,
			});
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("deleteFriendRequest", () => {
		it("Deletes friend request and responds with HTTP 204", async () => {
			mockedDeleteFriendRequest.mockResolvedValue({} as any);

			const req = {
				parsedParams: { uuid: "user-uuid" },
				parsedBody: { requestId: "req-uuid" },
			} as any;

			const res = createResponseMock();
			const next = vi.fn();

			await deleteFriendRequest(req, res as any, next);

			expect(mockedDeleteFriendRequest).toHaveBeenCalledWith(
				"user-uuid",
				"req-uuid",
			);
			expect(res.sendStatus).toHaveBeenCalledWith(204);
			expect(next).not.toHaveBeenCalled();
		});
	});
});
