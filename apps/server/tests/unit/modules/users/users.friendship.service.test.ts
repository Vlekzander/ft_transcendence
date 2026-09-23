import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma.lib";
import { UsersService } from "@/modules/users/users.service";
import {
	getPrismaConstraintFields,
	sharedService,
	userDtoSelect,
} from "@/modules/shared/shared.service";

vi.mock("@/lib/prisma.lib", () => ({
	prisma: {
		friendship: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		user: {
			findMany: vi.fn(),
		},
	},
}));

vi.mock("@/modules/shared/shared.service", () => ({
	sharedService: {
		getUserById: vi.fn(),
	},
	getPrismaConstraintFields: vi.fn(),
	userDtoSelect: {
		uuid: true,
		email: true,
		username: true,
		avatarPath: true,
		createdAt: true,
	},
}));

const mockedFindMany = vi.mocked(prisma.friendship.findMany);
const mockedFindFirst = vi.mocked(prisma.friendship.findFirst);
const mockedCreate = vi.mocked(prisma.friendship.create);
const mockedUpdate = vi.mocked(prisma.friendship.update);
const mockedDelete = vi.mocked(prisma.friendship.delete);
const mockedUserFindMany = vi.mocked(prisma.user.findMany);
const mockedGetPrismaConstraintFields = vi.mocked(getPrismaConstraintFields);
const mockedGetUserById = vi.mocked(sharedService.getUserById);

const sender = {
	uuid: "sender-uuid",
	email: "sender@email.com",
	username: "sender",
	avatarPath: null,
	createdAt: new Date("2026-01-01"),
};

const receiver = {
	uuid: "receiver-uuid",
	email: "receiver@email.com",
	username: "receiver",
	avatarPath: "receiver-avatar.png",
	createdAt: new Date("2026-01-02"),
};

const acceptedFriendshipFromDatabase = {
	uuid: "friendship-uuid",
	senderId: sender.uuid,
	receiverId: receiver.uuid,
	status: "ACCEPTED",
	createdAt: new Date("2026-01-03"),
	sender,
	receiver,
};

const pendingRequestFromDatabase = {
	uuid: "request-uuid",
	senderId: sender.uuid,
	receiverId: receiver.uuid,
	status: "PENDING",
	createdAt: new Date("2026-01-04"),
	sender,
	receiver,
};

function createPrismaError(code: string, meta?: Record<string, unknown>) {
	return new Prisma.PrismaClientKnownRequestError("Message", {
		code,
		clientVersion: "x.y.z",
		meta,
	});
}

describe("users/users.service friendships", () => {
	const service = new UsersService();

	beforeEach(() => {
		vi.clearAllMocks();
		mockedGetPrismaConstraintFields.mockReturnValue([]);
		mockedGetUserById.mockResolvedValue(sender as any);
	});

	describe("getFriendships", () => {
		it("should throw UnknownUserIdError when the user does not exist", async () => {
			mockedGetUserById.mockResolvedValue(null);

			await expect(
				service.getFriendships("unknown-uuid"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("should return the other user for accepted friendships where the user is sender", async () => {
			mockedFindMany.mockResolvedValue([
				acceptedFriendshipFromDatabase,
			] as any);

			const result = await service.getFriendships(sender.uuid);

			expect(mockedFindMany).toHaveBeenCalledWith({
				where: {
					status: "ACCEPTED",
					OR: [
						{ senderId: sender.uuid },
						{ receiverId: sender.uuid },
					],
				},
				include: {
					sender: { select: userDtoSelect },
					receiver: { select: userDtoSelect },
				},
				orderBy: { uuid: "desc" },
			});
			expect(result).toEqual([
				{ uuid: acceptedFriendshipFromDatabase.uuid, user: receiver },
			]);
		});

		it("should return the other user for accepted friendships where the user is receiver", async () => {
			mockedGetUserById.mockResolvedValue(receiver as any);
			mockedFindMany.mockResolvedValue([
				acceptedFriendshipFromDatabase,
			] as any);

			const result = await service.getFriendships(receiver.uuid);

			expect(result).toEqual([
				{ uuid: acceptedFriendshipFromDatabase.uuid, user: sender },
			]);
		});

		it("should throw InvalidIdError when Prisma returns P2007", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2007"));

			await expect(
				service.getFriendships(sender.uuid),
			).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});
	});

	describe("getPendingFriendRequests", () => {
		it("should return pending friend requests received by the user", async () => {
			mockedFindMany.mockResolvedValue([
				pendingRequestFromDatabase,
			] as any);

			const result = await service.getPendingFriendRequests(
				receiver.uuid,
			);

			expect(mockedFindMany).toHaveBeenCalledWith({
				where: {
					status: "PENDING",
					OR: [{ receiverId: receiver.uuid }],
				},
				include: { sender: { select: userDtoSelect } },
				orderBy: { uuid: "desc" },
			});
			expect(result).toEqual([
				{ uuid: pendingRequestFromDatabase.uuid, sender },
			]);
		});

		it("should throw InvalidIdError when Prisma returns P2007", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2007"));

			await expect(
				service.getPendingFriendRequests(receiver.uuid),
			).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});
	});

	describe("getSentFriendRequests", () => {
		it("should return pending friend requests sent by the user", async () => {
			mockedFindMany.mockResolvedValue([
				pendingRequestFromDatabase,
			] as any);

			const result = await service.getSentFriendRequests(sender.uuid);

			expect(mockedFindMany).toHaveBeenCalledWith({
				where: {
					status: "PENDING",
					OR: [{ senderId: sender.uuid }],
				},
				include: { receiver: { select: userDtoSelect } },
				orderBy: { uuid: "desc" },
			});
			expect(result).toEqual([
				{ uuid: pendingRequestFromDatabase.uuid, receiver },
			]);
		});

		it("should throw InvalidIdError when Prisma returns P2007", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2007"));

			await expect(
				service.getSentFriendRequests(sender.uuid),
			).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});
	});

	describe("sendFriendRequest", () => {
		it("should throw SelfFriendRequestError when sender and receiver are the same user", async () => {
			await expect(
				service.sendFriendRequest(sender.uuid, sender.uuid),
			).rejects.toMatchObject({
				name: "SelfFriendRequestError",
			});
			expect(mockedFindFirst).not.toHaveBeenCalled();
			expect(mockedCreate).not.toHaveBeenCalled();
		});

		it("should create a pending request when no prior relationship exists", async () => {
			mockedFindFirst.mockResolvedValue(null);
			mockedCreate.mockResolvedValue(pendingRequestFromDatabase as any);

			const result = await service.sendFriendRequest(
				sender.uuid,
				receiver.uuid,
			);

			expect(mockedFindFirst).toHaveBeenCalledWith({
				where: {
					OR: [
						{ senderId: sender.uuid, receiverId: receiver.uuid },
						{ senderId: receiver.uuid, receiverId: sender.uuid },
					],
				},
			});
			expect(mockedCreate).toHaveBeenCalledWith({
				data: { senderId: sender.uuid, receiverId: receiver.uuid },
				include: { receiver: { select: userDtoSelect } },
			});
			expect(result).toEqual(pendingRequestFromDatabase);
		});

		it("should throw FriendshipAlreadyExistError when an accepted friendship already exists", async () => {
			mockedFindFirst.mockResolvedValue(
				acceptedFriendshipFromDatabase as any,
			);

			await expect(
				service.sendFriendRequest(sender.uuid, receiver.uuid),
			).rejects.toMatchObject({
				name: "FriendshipAlreadyExistError",
			});
		});

		it("should throw PendingFriendRequestExistError when a pending request already exists", async () => {
			mockedFindFirst.mockResolvedValue(
				pendingRequestFromDatabase as any,
			);

			await expect(
				service.sendFriendRequest(sender.uuid, receiver.uuid),
			).rejects.toMatchObject({
				name: "PendingFriendRequestExistError",
			});
		});
	});

	describe("acceptFriendRequest", () => {
		it("should accept request and return the friendship with user equal to sender", async () => {
			const updated = {
				uuid: pendingRequestFromDatabase.uuid,
				status: "ACCEPTED",
				sender,
				receiver,
			};
			mockedUpdate.mockResolvedValue(updated as any);

			const result = await service.acceptFriendRequest(
				receiver.uuid,
				pendingRequestFromDatabase.uuid,
			);

			expect(mockedUpdate).toHaveBeenCalledWith({
				where: {
					uuid: pendingRequestFromDatabase.uuid,
					receiverId: receiver.uuid,
				},
				data: { status: "ACCEPTED" },
				include: {
					sender: { select: userDtoSelect },
					receiver: { select: userDtoSelect },
				},
			});
			expect(result).toEqual({
				uuid: pendingRequestFromDatabase.uuid,
				user: sender,
			});
		});

		it("should throw UnknownFriendRequestError on P2025 when no specific field is identified", async () => {
			mockedUpdate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue([]);

			await expect(
				service.acceptFriendRequest(receiver.uuid, "unknown-req-uuid"),
			).rejects.toMatchObject({
				name: "UnknownFriendRequestError",
			});
		});

		it("should throw UnknownUserIdError on P2025 when constraint involves receiverId", async () => {
			mockedUpdate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["receiverId"]);

			await expect(
				service.acceptFriendRequest("unknown-user", "req-uuid"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});
	});

	describe("deleteFriendRequest", () => {
		it("should delete friendship or request addressed to or sent by the user", async () => {
			mockedDelete.mockResolvedValue(pendingRequestFromDatabase as any);

			const result = await service.deleteFriendRequest(
				receiver.uuid,
				pendingRequestFromDatabase.uuid,
			);

			expect(mockedDelete).toHaveBeenCalledWith({
				where: {
					uuid: pendingRequestFromDatabase.uuid,
					OR: [
						{ receiverId: receiver.uuid },
						{ senderId: receiver.uuid },
					],
				},
			});
			expect(result).toEqual(pendingRequestFromDatabase);
		});

		it("should throw UnknownUserIdError on P2025 when receiverId or senderId is involved", async () => {
			mockedDelete.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["senderId"]);

			await expect(
				service.deleteFriendRequest("unknown-user", "req-uuid"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("should throw UnknownFriendRequestError on P2025 when uuid is involved", async () => {
			mockedDelete.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["uuid"]);

			await expect(
				service.deleteFriendRequest("user-uuid", "unknown-req"),
			).rejects.toMatchObject({
				name: "UnknownFriendRequestError",
			});
		});
	});

	describe("searchUser", () => {
		it("should perform case-insensitive prefix search on username", async () => {
			mockedUserFindMany.mockResolvedValue([sender] as any);

			const result = await service.searchUser("sen");

			expect(mockedUserFindMany).toHaveBeenCalledWith({
				where: {
					username: {
						startsWith: "sen",
						mode: "insensitive",
					},
				},
			});
			expect(result).toEqual([sender]);
		});
	});
});
