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
		userOnGame: {
			findMany: vi.fn(),
		},
		user: {
			update: vi.fn(),
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

vi.mock("@/websocket.server", () => ({
	isUserOnline: vi.fn(),
}));

const mockedFindMany = vi.mocked(prisma.friendship.findMany);
const mockedFindFirst = vi.mocked(prisma.friendship.findFirst);
const mockedCreate = vi.mocked(prisma.friendship.create);
const mockedUpdate = vi.mocked(prisma.friendship.update);
const mockedDelete = vi.mocked(prisma.friendship.delete);
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
		it("Throws UnknownUserIdError when the user does not exist", async () => {
			mockedGetUserById.mockResolvedValue(null);

			await expect(
				service.getFriendships("unknown-uuid"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("Returns the other user for accepted friendships where user is sender", async () => {
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
				{
					uuid: acceptedFriendshipFromDatabase.uuid,
					user: receiver,
				},
			]);
		});

		it("Returns the other user for accepted friendships where user is receiver", async () => {
			mockedGetUserById.mockResolvedValue(receiver as any);
			mockedFindMany.mockResolvedValue([
				acceptedFriendshipFromDatabase,
			] as any);

			const result = await service.getFriendships(receiver.uuid);

			expect(result).toEqual([
				{
					uuid: acceptedFriendshipFromDatabase.uuid,
					user: sender,
				},
			]);
		});
	});

	describe("getPendingFriendRequests", () => {
		it("Returns pending requests received by the user", async () => {
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
				include: {
					sender: { select: userDtoSelect },
				},
				orderBy: { uuid: "desc" },
			});

			expect(result).toEqual([
				{
					uuid: pendingRequestFromDatabase.uuid,
					sender,
				},
			]);
		});
	});

	describe("sendFriendRequest", () => {
		it("Rejects a request sent to the same user", async () => {
			await expect(
				service.sendFriendRequest(sender.uuid, sender.uuid),
			).rejects.toMatchObject({
				name: "SelfFriendRequestError",
			});

			expect(mockedFindFirst).not.toHaveBeenCalled();
			expect(mockedCreate).not.toHaveBeenCalled();
		});

		it("Creates a pending request when no relationship exists", async () => {
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
				data: {
					senderId: sender.uuid,
					receiverId: receiver.uuid,
				},
				include: {
					receiver: { select: userDtoSelect },
				},
			});

			expect(result).toEqual(pendingRequestFromDatabase);
		});

		it("Rejects when accepted friendship already exists", async () => {
			mockedFindFirst.mockResolvedValue(
				acceptedFriendshipFromDatabase as any,
			);

			await expect(
				service.sendFriendRequest(sender.uuid, receiver.uuid),
			).rejects.toMatchObject({
				name: "FriendshipAlreadyExistError",
			});
		});

		it("Rejects when pending request already exists", async () => {
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
		it("Accepts request and returns friendship with user = sender", async () => {
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

		it("Throws UnknownFriendRequestError on P2025 when fields are empty", async () => {
			mockedUpdate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue([]);

			await expect(
				service.acceptFriendRequest(receiver.uuid, "unknown-req-uuid"),
			).rejects.toMatchObject({
				name: "UnknownFriendRequestError",
			});
		});
	});

	describe("deleteFriendRequest", () => {
		it("Deletes friendship or request addressed to the receiver", async () => {
			mockedDelete.mockResolvedValue(pendingRequestFromDatabase as any);

			const result = await service.deleteFriendRequest(
				receiver.uuid,
				pendingRequestFromDatabase.uuid,
			);

			expect(mockedDelete).toHaveBeenCalledWith({
				where: {
					uuid: pendingRequestFromDatabase.uuid,
					receiverId: receiver.uuid,
				},
			});

			expect(result).toEqual(pendingRequestFromDatabase);
		});

		it("Throws UnknownUserIdError on P2025 with receiverId", async () => {
			mockedDelete.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["receiverId"]);

			await expect(
				service.deleteFriendRequest("unknown-uuid", "req-uuid"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});
	});
});
