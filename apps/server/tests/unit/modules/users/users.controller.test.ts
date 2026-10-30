import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	acceptFriendRequest,
	deleteFriendRequest,
	getFriends,
	getPendingFriendRequests,
	getSentFriendRequests,
	getUser,
	getUserHistory,
	getUserStats,
	searchUser,
	sendFriendRequest,
	updateAvatar,
	updateUser,
} from "@/modules/users/users.controller";

import { getUserAchievements } from "@/modules/achievements/achievements.controller";
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
		getSentFriendRequests: vi.fn(),
		sendFriendRequest: vi.fn(),
		acceptFriendRequest: vi.fn(),
		deleteFriendRequest: vi.fn(),
		searchUser: vi.fn(),
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
const mockedGetSentFriendRequests = vi.mocked(
	usersService.getSentFriendRequests,
);
const mockedSendFriendRequest = vi.mocked(usersService.sendFriendRequest);
const mockedAcceptFriendRequest = vi.mocked(usersService.acceptFriendRequest);
const mockedDeleteFriendRequest = vi.mocked(usersService.deleteFriendRequest);
const mockedSearchUser = vi.mocked(usersService.searchUser);

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
		it("should return a public user with HTTP 200", async () => {
			mockedGetUserById.mockResolvedValue(user as any);
			const req = { parsedParams: { uuid: "user-uuid" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getUser(req, res as any, next);

			expect(mockedGetUserById).toHaveBeenCalledWith("user-uuid");
			expect(mockedToPublicUserDTO).toHaveBeenCalledWith(user);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ user: publicUserDTO });
			expect(next).not.toHaveBeenCalled();
		});

		it("should call next with UnknownUserIdError when the user does not exist", async () => {
			mockedGetUserById.mockResolvedValue(null);
			const req = { parsedParams: { uuid: "unknown-uuid" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getUser(req, res as any, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "UnknownUserIdError",
			});
			expect(res.status).not.toHaveBeenCalled();
		});

		it("should forward shared service errors to next", async () => {
			const error = new Error("Database unavailable");
			mockedGetUserById.mockRejectedValue(error);
			const req = { parsedParams: { uuid: "user-uuid" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getUser(req, res as any, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("getUserHistory", () => {
		it("should return user history with HTTP 200", async () => {
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
			const req = { parsedParams: { uuid: "user-uuid" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getUserHistory(req, res as any, next);

			expect(mockedGetUserHistory).toHaveBeenCalledWith("user-uuid");
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ history });
			expect(next).not.toHaveBeenCalled();
		});

		it("should forward history service errors to next", async () => {
			const error = new Error("History unavailable");
			mockedGetUserHistory.mockRejectedValue(error);
			const req = { parsedParams: { uuid: "user-uuid" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getUserHistory(req, res as any, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("getUserStats", () => {
		it("should return user statistics with HTTP 200", async () => {
			const req = {
				params: { uuid: "user-uuid" },
			} as any;
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

	describe("updateUser", () => {
		it("should update the user when the current password is valid", async () => {
			mockedValidateUserPassword.mockResolvedValue(true);
			mockedUpdateUser.mockResolvedValue(user as any);

			const req = {
				parsedParams: { uuid: "user-uuid" },
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
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ user: userResponseDTO });
			expect(next).not.toHaveBeenCalled();
		});

		it("should call next with InvalidCredentialsError when current password is invalid", async () => {
			mockedValidateUserPassword.mockResolvedValue(false);

			const req = {
				parsedParams: { uuid: "user-uuid" },
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
		it("should update the avatar and return user response DTO with HTTP 200", async () => {
			mockedUpdateUserAvatar.mockResolvedValue(user as any);
			const req = {
				parsedParams: { uuid: "user-uuid" },
				file: { path: `${AVATAR_DIR}/new-avatar.png` },
			} as any;
			const res = createResponseMock();
			const next = vi.fn();

			await updateAvatar(req, res as any, next);

			expect(mockedUpdateUserAvatar).toHaveBeenCalledWith(
				"user-uuid",
				"new-avatar.png",
			);
			expect(res.json).toHaveBeenCalledWith({ user: userResponseDTO });
			expect(next).not.toHaveBeenCalled();
		});

		it("should call next with NoFileUploadError when file is missing", async () => {
			const req = {
				parsedParams: { uuid: "user-uuid" },
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
		it("should return friendships mapped to DTOs with HTTP 200", async () => {
			const rawFriendships = [{ uuid: "f-1", user }];
			const mappedDTO = { uuid: "f-1", user: publicUserDTO };
			mockedGetFriendships.mockResolvedValue(rawFriendships as any);
			mockedToFriendshipDTO.mockReturnValue(mappedDTO as any);

			const req = { parsedParams: { uuid: "user-uuid" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getFriends(req, res as any, next);

			expect(mockedGetFriendships).toHaveBeenCalledWith("user-uuid");
			expect(mockedToFriendshipDTO).toHaveBeenCalledWith(
				rawFriendships[0],
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ friends: [mappedDTO] });
			expect(next).not.toHaveBeenCalled();
		});

		it("should forward friendship errors to next", async () => {
			const error = new Error("Friendship query failed");
			mockedGetFriendships.mockRejectedValue(error);

			const req = { parsedParams: { uuid: "user-uuid" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getFriends(req, res as any, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("getPendingFriendRequests", () => {
		it("should return pending friend requests mapped to DTOs with HTTP 200", async () => {
			const rawRequests = [{ uuid: "req-1", sender: user }];
			const mappedDTO = { uuid: "req-1", sender: publicUserDTO };
			mockedGetPendingFriendRequests.mockResolvedValue(
				rawRequests as any,
			);
			mockedToPendingFriendRequestDTO.mockReturnValue(mappedDTO as any);

			const req = { parsedParams: { uuid: "user-uuid" } } as any;
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
				pendingRequests: [mappedDTO],
			});
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("getSentFriendRequests", () => {
		it("should return sent friend requests mapped to DTOs with HTTP 200", async () => {
			const rawSent = [{ uuid: "req-1", receiver: user }];
			const mappedDTO = { uuid: "req-1", receiver: publicUserDTO };
			mockedGetSentFriendRequests.mockResolvedValue(rawSent as any);
			mockedToSentFriendRequestDTO.mockReturnValue(mappedDTO as any);

			const req = { parsedParams: { uuid: "user-uuid" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getSentFriendRequests(req, res as any, next);

			expect(mockedGetSentFriendRequests).toHaveBeenCalledWith(
				"user-uuid",
			);
			expect(mockedToSentFriendRequestDTO).toHaveBeenCalledWith(
				rawSent[0],
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				sentRequests: [mappedDTO],
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("should forward sent friend request errors to next", async () => {
			const error = new Error("Failed to get sent requests");
			mockedGetSentFriendRequests.mockRejectedValue(error);

			const req = { parsedParams: { uuid: "user-uuid" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getSentFriendRequests(req, res as any, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("sendFriendRequest", () => {
		it("should send a friend request and return sentRequest with HTTP 200", async () => {
			const created = { uuid: "req-1", receiver: user };
			const mappedDTO = { uuid: "req-1", receiver: publicUserDTO };
			mockedSendFriendRequest.mockResolvedValue(created as any);
			mockedToSentFriendRequestDTO.mockReturnValue(mappedDTO as any);

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
			expect(mockedToSentFriendRequestDTO).toHaveBeenCalledWith(created);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ sentRequest: mappedDTO });
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("acceptFriendRequest", () => {
		it("should accept a friend request and return friend with HTTP 200", async () => {
			const accepted = { uuid: "f-1", user };
			const mappedDTO = { uuid: "f-1", user: publicUserDTO };
			mockedAcceptFriendRequest.mockResolvedValue(accepted as any);
			mockedToFriendshipDTO.mockReturnValue(mappedDTO as any);

			const req = {
				parsedParams: { uuid: "user-uuid" },
				parsedBody: { requestId: "req-1" },
			} as any;
			const res = createResponseMock();
			const next = vi.fn();

			await acceptFriendRequest(req, res as any, next);

			expect(mockedAcceptFriendRequest).toHaveBeenCalledWith(
				"user-uuid",
				"req-1",
			);
			expect(mockedToFriendshipDTO).toHaveBeenCalledWith(accepted);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ friend: mappedDTO });
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("deleteFriendRequest", () => {
		it("should delete a friend request and respond with HTTP 204", async () => {
			mockedDeleteFriendRequest.mockResolvedValue({} as any);
			const req = {
				parsedParams: { uuid: "user-uuid" },
				parsedBody: { requestId: "req-1" },
			} as any;
			const res = createResponseMock();
			const next = vi.fn();

			await deleteFriendRequest(req, res as any, next);

			expect(mockedDeleteFriendRequest).toHaveBeenCalledWith(
				"user-uuid",
				"req-1",
			);
			expect(res.sendStatus).toHaveBeenCalledWith(204);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe("searchUser", () => {
		it("should search users and return matches with HTTP 200", async () => {
			mockedSearchUser.mockResolvedValue([user] as any);
			mockedToPublicUserDTO.mockReturnValue(publicUserDTO);

			const req = { parsedQuery: { query: "usr" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await searchUser(req, res as any, next);

			expect(mockedSearchUser).toHaveBeenCalledWith("usr");
			expect(mockedToPublicUserDTO).toHaveBeenCalledWith(user);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ users: [publicUserDTO] });
			expect(next).not.toHaveBeenCalled();
		});

		it("should forward search errors to next", async () => {
			const error = new Error("Search Error");
			mockedSearchUser.mockRejectedValue(error);

			const req = { parsedQuery: { query: "usr" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await searchUser(req, res as any, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
