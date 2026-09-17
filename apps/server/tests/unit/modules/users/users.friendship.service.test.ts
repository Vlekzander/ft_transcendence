import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma.lib";
import { UsersService } from "@/modules/users/users.service";
import { getPrismaConstraintFields } from "@/modules/shared/shared.service";

vi.mock("@/lib/prisma.lib", () => ({
	prisma: {
		friendship: {
			findMany: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

vi.mock("@/modules/shared/shared.service", async () => {
	const actual = await vi.importActual<
		typeof import("@/modules/shared/shared.service")
	>("@/modules/shared/shared.service");

	return {
		...actual,
		getPrismaConstraintFields: vi.fn(),
	};
});

const mockedFindMany = vi.mocked(prisma.friendship.findMany);
const mockedFindFirst = vi.mocked(prisma.friendship.findFirst);
const mockedCreate = vi.mocked(prisma.friendship.create);
const mockedUpdate = vi.mocked(prisma.friendship.update);
const mockedDelete = vi.mocked(prisma.friendship.delete);
const mockedGetPrismaConstraintFields = vi.mocked(getPrismaConstraintFields);

const sender = {
	uuid: "sender-uuid",
	username: "sender",
	avatarPath: null,
};

const receiver = {
	uuid: "receiver-uuid",
	username: "receiver",
	avatarPath: "receiver-avatar.png",
};

const acceptedFriendship = {
	uuid: "friendship-uuid",
	senderId: sender.uuid,
	receiverId: receiver.uuid,
	status: "ACCEPTED",
	createdAt: new Date("2026-01-01"),
	sender,
	receiver,
};

const pendingFriendRequest = {
	uuid: "request-uuid",
	senderId: sender.uuid,
	receiverId: receiver.uuid,
	status: "PENDING",
	createdAt: new Date("2026-01-01"),
	sender,
	receiver,
};

function createPrismaError(code: string, meta?: Record<string, unknown>) {
	const error = new Prisma.PrismaClientKnownRequestError("Message", {
		code: code,
		clientVersion: "x.y.z",
		meta: meta,
	});
	return error;
}

describe("users/users.service friendships", () => {
	const service = new UsersService();

	beforeEach(() => {
		vi.clearAllMocks();
		mockedGetPrismaConstraintFields.mockReturnValue([]);
	});

	describe("getFriendships", () => {
		it("Returns accepted friendships involving the user", async () => {
			// Arrange
			mockedFindMany.mockResolvedValue([acceptedFriendship] as any);

			// Act
			const result = await service.getFriendships(receiver.uuid);

			// Assert
			expect(mockedFindMany).toHaveBeenCalledWith({
				where: {
					status: "ACCEPTED",
					OR: [
						{
							senderId: receiver.uuid,
						},
						{
							receiverId: receiver.uuid,
						},
					],
				},
				include: {
					sender: {
						select: {
							uuid: true,
							username: true,
							avatarPath: true,
						},
					},
					receiver: {
						select: {
							uuid: true,
							username: true,
							avatarPath: true,
						},
					},
				},
				orderBy: {
					uuid: "desc",
				},
			});

			expect(result).toEqual([acceptedFriendship]);
		});

		it("Returns an empty array when the user has no accepted friendships", async () => {
			// Arrange
			mockedFindMany.mockResolvedValue([]);

			// Act
			const result = await service.getFriendships(receiver.uuid);

			// Assert
			expect(result).toEqual([]);
		});

		it("Does not return pending friend requests", async () => {
			// Arrange
			mockedFindMany.mockResolvedValue([]);

			// Act
			await service.getFriendships(receiver.uuid);

			// Assert
			expect(mockedFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						status: "ACCEPTED",
					}),
				}),
			);
		});

		it("Throws InvalidIdError when Prisma returns P2007", async () => {
			// Arrange
			mockedFindMany.mockRejectedValue(createPrismaError("P2007"));

			// Act
			const action = service.getFriendships("invalid-user-uuid");

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("Throws UnknownUserIdError when Prisma returns P2025", async () => {
			// Arrange
			mockedFindMany.mockRejectedValue(createPrismaError("P2025"));

			// Act
			const action = service.getFriendships("unknown-user-uuid");

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("Rethrows unexpected Prisma errors", async () => {
			// Arrange
			const error = new Error("Database unavailable");

			mockedFindMany.mockRejectedValue(error);

			// Act
			const action = service.getFriendships(receiver.uuid);

			// Assert
			await expect(action).rejects.toBe(error);
		});
	});

	describe("getPendingFriendRequest", () => {
		it("Returns pending requests received by the user", async () => {
			// Arrange
			mockedFindMany.mockResolvedValue([pendingFriendRequest] as any);

			// Act
			const result = await service.getPendingFriendRequest(receiver.uuid);

			// Assert
			expect(mockedFindMany).toHaveBeenCalledWith({
				where: {
					status: "PENDING",
					OR: [
						{
							receiverId: receiver.uuid,
						},
					],
				},
				include: {
					sender: {
						select: {
							uuid: true,
							username: true,
							avatarPath: true,
						},
					},
				},
				orderBy: {
					uuid: "desc",
				},
			});

			expect(result).toEqual([pendingFriendRequest]);
		});

		it("Returns an empty array when no pending request exists", async () => {
			// Arrange
			mockedFindMany.mockResolvedValue([]);

			// Act
			const result = await service.getPendingFriendRequest(receiver.uuid);

			// Assert
			expect(result).toEqual([]);
		});

		it("Only searches requests received by the user", async () => {
			// Arrange
			mockedFindMany.mockResolvedValue([]);

			// Act
			await service.getPendingFriendRequest(receiver.uuid);

			// Assert
			expect(mockedFindMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						status: "PENDING",
						OR: [
							{
								receiverId: receiver.uuid,
							},
						],
					},
				}),
			);
		});

		it("Throws InvalidIdError when Prisma returns P2007", async () => {
			// Arrange
			mockedFindMany.mockRejectedValue(createPrismaError("P2007"));

			// Act
			const action = service.getPendingFriendRequest("invalid-user-uuid");

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("Throws UnknownUserIdError when Prisma returns P2025", async () => {
			// Arrange
			mockedFindMany.mockRejectedValue(createPrismaError("P2025"));

			// Act
			const action = service.getPendingFriendRequest("unknown-user-uuid");

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("Rethrows unexpected Prisma errors", async () => {
			// Arrange
			const error = new Error("Database unavailable");

			mockedFindMany.mockRejectedValue(error);

			// Act
			const action = service.getPendingFriendRequest(receiver.uuid);

			// Assert
			await expect(action).rejects.toBe(error);
		});
	});

	describe("sendFriendRequest", () => {
		it("Rejects a request sent to the same user", async () => {
			// Arrange
			const uuid = "same-user-uuid";

			// Act
			const action = service.sendFriendRequest(uuid, uuid);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "SelfFriendRequestError",
			});

			expect(mockedFindFirst).not.toHaveBeenCalled();
			expect(mockedCreate).not.toHaveBeenCalled();
		});

		it("Creates a pending friend request when no relationship exists", async () => {
			// Arrange
			mockedFindFirst.mockResolvedValue(null);
			mockedCreate.mockResolvedValue(pendingFriendRequest as any);

			// Act
			const result = await service.sendFriendRequest(
				sender.uuid,
				receiver.uuid,
			);

			// Assert
			expect(mockedFindFirst).toHaveBeenCalledWith({
				where: {
					OR: [
						{
							senderId: sender.uuid,
							receiverId: receiver.uuid,
						},
						{
							senderId: receiver.uuid,
							receiverId: sender.uuid,
						},
					],
				},
			});

			expect(mockedCreate).toHaveBeenCalledWith({
				data: {
					senderId: sender.uuid,
					receiverId: receiver.uuid,
				},
			});

			expect(result).toEqual(pendingFriendRequest);
		});

		it("Rejects a request when an accepted friendship already exists", async () => {
			// Arrange
			mockedFindFirst.mockResolvedValue(acceptedFriendship as any);

			// Act
			const action = service.sendFriendRequest(
				sender.uuid,
				receiver.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "FriendshipAlreadyExistError",
			});

			expect(mockedCreate).not.toHaveBeenCalled();
		});

		it("Rejects a request when a pending request already exists", async () => {
			// Arrange
			mockedFindFirst.mockResolvedValue(pendingFriendRequest as any);

			// Act
			const action = service.sendFriendRequest(
				sender.uuid,
				receiver.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "PendingFriendRequestExistError",
			});

			expect(mockedCreate).not.toHaveBeenCalled();
		});

		it("Checks both directions before creating a request", async () => {
			// Arrange
			mockedFindFirst.mockResolvedValue(null);
			mockedCreate.mockResolvedValue(pendingFriendRequest as any);

			// Act
			await service.sendFriendRequest(sender.uuid, receiver.uuid);

			// Assert
			expect(mockedFindFirst).toHaveBeenCalledWith({
				where: {
					OR: [
						{
							senderId: sender.uuid,
							receiverId: receiver.uuid,
						},
						{
							senderId: receiver.uuid,
							receiverId: sender.uuid,
						},
					],
				},
			});
		});

		it("Throws InvalidIdError when Prisma returns P2007", async () => {
			// Arrange
			mockedFindFirst.mockRejectedValue(createPrismaError("P2007"));

			// Act
			const action = service.sendFriendRequest(
				sender.uuid,
				receiver.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});

			expect(mockedCreate).not.toHaveBeenCalled();
		});

		it("Throws UnknownUserIdError when Prisma returns P2025", async () => {
			// Arrange
			mockedFindFirst.mockRejectedValue(createPrismaError("P2025"));

			// Act
			const action = service.sendFriendRequest(
				sender.uuid,
				receiver.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});

			expect(mockedCreate).not.toHaveBeenCalled();
		});

		it("Rethrows unexpected errors", async () => {
			// Arrange
			const error = new Error("Database unavailable");

			mockedFindFirst.mockRejectedValue(error);

			// Act
			const action = service.sendFriendRequest(
				sender.uuid,
				receiver.uuid,
			);

			// Assert
			await expect(action).rejects.toBe(error);
		});
	});

	describe("acceptFriendRequest", () => {
		it("Accepts a request addressed to the receiver", async () => {
			// Arrange
			const accepted = {
				...pendingFriendRequest,
				status: "ACCEPTED",
			};

			mockedUpdate.mockResolvedValue(accepted as any);

			// Act
			const result = await service.acceptFriendRequest(
				receiver.uuid,
				pendingFriendRequest.uuid,
			);

			// Assert
			expect(mockedUpdate).toHaveBeenCalledWith({
				where: {
					uuid: pendingFriendRequest.uuid,
					receiverId: receiver.uuid,
				},
				data: {
					status: "ACCEPTED",
				},
			});

			expect(result).toEqual(accepted);
		});

		it("Throws InvalidIdError when Prisma returns P2007", async () => {
			// Arrange
			mockedUpdate.mockRejectedValue(createPrismaError("P2007"));

			// Act
			const action = service.acceptFriendRequest(
				receiver.uuid,
				pendingFriendRequest.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("Throws UnknownFriendRequestError when the request UUID is not found", async () => {
			// Arrange
			const error = createPrismaError("P2025");

			mockedUpdate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["uuid"]);

			// Act
			const action = service.acceptFriendRequest(
				receiver.uuid,
				"unknown-request-uuid",
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownFriendRequestError",
			});

			expect(mockedGetPrismaConstraintFields).toHaveBeenCalledWith(error);
		});

		it("Throws UnknownUserIdError when the receiver UUID is not found", async () => {
			// Arrange
			const error = createPrismaError("P2025");

			mockedUpdate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["receiverId"]);

			// Act
			const action = service.acceptFriendRequest(
				"unknown-user-uuid",
				pendingFriendRequest.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("Throws UnknownElementError when Prisma identifies another missing field", async () => {
			// Arrange
			const error = createPrismaError("P2025");

			mockedUpdate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["senderId"]);

			// Act
			const action = service.acceptFriendRequest(
				receiver.uuid,
				pendingFriendRequest.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownElementError",
			});
		});

		it("Throws UnknownElementError when P2025 has no fields", async () => {
			// Arrange
			const error = createPrismaError("P2025");

			mockedUpdate.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue([]);

			// Act
			const action = service.acceptFriendRequest(
				receiver.uuid,
				pendingFriendRequest.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownElementError",
			});
		});

		it("Rethrows unexpected errors", async () => {
			// Arrange
			const error = new Error("Database unavailable");

			mockedUpdate.mockRejectedValue(error);

			// Act
			const action = service.acceptFriendRequest(
				receiver.uuid,
				pendingFriendRequest.uuid,
			);

			// Assert
			await expect(action).rejects.toBe(error);
		});
	});

	describe("deleteFriendRequest", () => {
		it("Deletes a request addressed to the receiver", async () => {
			// Arrange
			mockedDelete.mockResolvedValue(pendingFriendRequest as any);

			// Act
			const result = await service.deleteFriendRequest(
				receiver.uuid,
				pendingFriendRequest.uuid,
			);

			// Assert
			expect(mockedDelete).toHaveBeenCalledWith({
				where: {
					uuid: pendingFriendRequest.uuid,
					receiverId: receiver.uuid,
				},
			});

			expect(result).toEqual(pendingFriendRequest);
		});

		it("Deletes an accepted friendship with the same method", async () => {
			// Arrange
			mockedDelete.mockResolvedValue(acceptedFriendship as any);

			// Act
			const result = await service.deleteFriendRequest(
				receiver.uuid,
				acceptedFriendship.uuid,
			);

			// Assert
			expect(mockedDelete).toHaveBeenCalledWith({
				where: {
					uuid: acceptedFriendship.uuid,
					receiverId: receiver.uuid,
				},
			});

			expect(result).toEqual(acceptedFriendship);
		});

		it("Throws InvalidIdError when Prisma returns P2007", async () => {
			// Arrange
			mockedDelete.mockRejectedValue(createPrismaError("P2007"));

			// Act
			const action = service.deleteFriendRequest(
				receiver.uuid,
				pendingFriendRequest.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("Throws UnknownFriendRequestError when the request UUID is not found", async () => {
			// Arrange
			const error = createPrismaError("P2025");

			mockedDelete.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["uuid"]);

			// Act
			const action = service.deleteFriendRequest(
				receiver.uuid,
				"unknown-request-uuid",
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownFriendRequestError",
			});
		});

		it("Throws UnknownUserIdError when the receiver UUID is not found", async () => {
			// Arrange
			const error = createPrismaError("P2025");

			mockedDelete.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue(["receiverId"]);

			// Act
			const action = service.deleteFriendRequest(
				"unknown-user-uuid",
				pendingFriendRequest.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("Throws UnknownElementError when P2025 has no fields", async () => {
			// Arrange
			const error = createPrismaError("P2025");

			mockedDelete.mockRejectedValue(error);
			mockedGetPrismaConstraintFields.mockReturnValue([]);

			// Act
			const action = service.deleteFriendRequest(
				receiver.uuid,
				pendingFriendRequest.uuid,
			);

			// Assert
			await expect(action).rejects.toMatchObject({
				name: "UnknownElementError",
			});
		});

		it("Rethrows unexpected errors", async () => {
			// Arrange
			const error = new Error("Database unavailable");

			mockedDelete.mockRejectedValue(error);

			// Act
			const action = service.deleteFriendRequest(
				receiver.uuid,
				pendingFriendRequest.uuid,
			);

			// Assert
			await expect(action).rejects.toBe(error);
		});
	});
});
