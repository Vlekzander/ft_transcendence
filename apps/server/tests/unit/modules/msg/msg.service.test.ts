import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma.lib";
import { MsgService } from "@/modules/msg/msg.service";
import { getPrismaConstraintFields } from "@/modules/shared/shared.service";

vi.mock("@/lib/prisma.lib", () => ({
	prisma: {
		message: {
			create: vi.fn(),
			findMany: vi.fn(),
		},
	},
}));

vi.mock("@/modules/shared/shared.service", () => ({
	getPrismaConstraintFields: vi.fn(),
}));

const mockedCreate = vi.mocked(prisma.message.create);
const mockedFindMany = vi.mocked(prisma.message.findMany);
const mockedGetPrismaConstraintFields = vi.mocked(getPrismaConstraintFields);

function createPrismaError(code: string, meta?: Record<string, unknown>) {
	return new Prisma.PrismaClientKnownRequestError("Message", {
		code,
		clientVersion: "x.y.z",
		meta,
	});
}

describe("msg/msg.service", () => {
	const service = new MsgService();

	beforeEach(() => {
		vi.clearAllMocks();
		mockedGetPrismaConstraintFields.mockReturnValue([]);
	});

	describe("sendMessage", () => {
		it("should successfully persist and return a new message", async () => {
			const messageRecord = {
				uuid: "msg-uuid",
				senderId: "sender-uuid",
				receiverId: "receiver-uuid",
				content: "Hi there!",
				createdAt: new Date("2026-01-01"),
			};

			mockedCreate.mockResolvedValue(messageRecord as any);

			const result = await service.sendMessage(
				"sender-uuid",
				"receiver-uuid",
				"Hi there!",
			);

			expect(mockedCreate).toHaveBeenCalledWith({
				data: {
					senderId: "sender-uuid",
					receiverId: "receiver-uuid",
					content: "Hi there!",
				},
			});
			expect(result).toEqual(messageRecord);
		});

		it("should throw InvalidIdError when Prisma throws P2007", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2007"));

			await expect(
				service.sendMessage("bad-id", "receiver-uuid", "Hi"),
			).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("should throw UnknownUserIdError when Prisma throws P2025 on senderId", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["senderId"]);

			await expect(
				service.sendMessage("unknown-sender", "receiver-uuid", "Hi"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("should throw UnknownUserIdError when Prisma throws P2025 on receiverId", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["receiverId"]);

			await expect(
				service.sendMessage("sender-uuid", "unknown-receiver", "Hi"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("should throw UnknownUserIdError when Prisma throws P2003 on receiverId", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2003"));
			mockedGetPrismaConstraintFields.mockReturnValue(["receiverId"]);

			await expect(
				service.sendMessage("sender-uuid", "unknown-receiver", "Hi"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("should throw UnknownElementError with field name on P2025 for other constraints", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["someField"]);

			await expect(
				service.sendMessage("sender-uuid", "receiver-uuid", "Hi"),
			).rejects.toMatchObject({
				name: "UnknownElementError",
			});
		});

		it("should throw UnknownElementError with 'unknown' on P2025 when no constraint field is matched", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue([]);

			await expect(
				service.sendMessage("sender-uuid", "receiver-uuid", "Hi"),
			).rejects.toMatchObject({
				name: "UnknownElementError",
			});
		});
	});

	describe("getConversation", () => {
		it("should return ordered conversation messages between two users", async () => {
			const conversation = [
				{
					uuid: "msg-1",
					senderId: "user-a",
					receiverId: "user-b",
					content: "Hello",
					createdAt: new Date("2026-01-01"),
				},
				{
					uuid: "msg-2",
					senderId: "user-b",
					receiverId: "user-a",
					content: "Hey!",
					createdAt: new Date("2026-01-02"),
				},
			];

			mockedFindMany.mockResolvedValue(conversation as any);

			const result = await service.getConversation("user-a", "user-b");

			expect(mockedFindMany).toHaveBeenCalledWith({
				where: {
					OR: [
						{ senderId: "user-a", receiverId: "user-b" },
						{ senderId: "user-b", receiverId: "user-a" },
					],
				},
				orderBy: { uuid: "asc" },
			});
			expect(result).toEqual(conversation);
		});

		it("should throw InvalidIdError when Prisma throws P2007", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2007"));

			await expect(
				service.getConversation("invalid-id", "user-b"),
			).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("should throw UnknownUserIdError when Prisma throws P2025 referencing receiverId", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["receiverId"]);

			await expect(
				service.getConversation("user-a", "unknown-user"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});
	});

	describe("getPreview", () => {
		it("should return unique latest messages per conversation partner with includes", async () => {
			const messages = [
				{
					uuid: "msg-2",
					senderId: "user-a",
					receiverId: "user-b",
					content: "Latest with b",
					sender: {
						uuid: "user-a",
						username: "UserA",
						avatarPath: null,
					},
					receiver: {
						uuid: "user-b",
						username: "UserB",
						avatarPath: null,
					},
					createdAt: new Date("2026-01-02"),
				},
				{
					uuid: "msg-1",
					senderId: "user-a",
					receiverId: "user-b",
					content: "Older with b",
					sender: {
						uuid: "user-a",
						username: "UserA",
						avatarPath: null,
					},
					receiver: {
						uuid: "user-b",
						username: "UserB",
						avatarPath: null,
					},
					createdAt: new Date("2026-01-01"),
				},
				{
					uuid: "msg-3",
					senderId: "user-c",
					receiverId: "user-a",
					content: "Latest with c",
					sender: {
						uuid: "user-c",
						username: "UserC",
						avatarPath: null,
					},
					receiver: {
						uuid: "user-a",
						username: "UserA",
						avatarPath: null,
					},
					createdAt: new Date("2026-01-03"),
				},
			];

			mockedFindMany.mockResolvedValue(messages as any);

			const result = await service.getPreview("user-a");

			expect(mockedFindMany).toHaveBeenCalledWith({
				where: {
					OR: [{ senderId: "user-a" }, { receiverId: "user-a" }],
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
				orderBy: { uuid: "desc" },
			});
			expect(result).toEqual([messages[0], messages[2]]);
		});

		it("should throw InvalidIdError when Prisma throws P2007", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2007"));

			await expect(
				service.getPreview("invalid-id"),
			).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("should throw UnknownUserIdError when Prisma throws P2025 referencing senderId", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["senderId"]);

			await expect(
				service.getPreview("unknown-user"),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});
	});
});
