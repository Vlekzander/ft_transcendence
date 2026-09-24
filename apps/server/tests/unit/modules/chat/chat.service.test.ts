import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma.lib";
import { getPrismaConstraintFields } from "@/modules/shared/shared.service";
import { ChatService } from "@/modules/chat/chat.service";

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

const senderId = "sender-uuid";
const receiverId = "receiver-uuid";
const content = "Hello world!";

const createdMessageFromDatabase = {
	uuid: "message-uuid",
	senderId,
	receiverId,
	content,
	createdAt: new Date("2026-01-01T10:00:00Z"),
};

function createPrismaError(code: string, meta?: Record<string, unknown>) {
	return new Prisma.PrismaClientKnownRequestError("Message", {
		code,
		clientVersion: "x.y.z",
		meta,
	});
}

describe("ChatService", () => {
	const service = new ChatService();

	beforeEach(() => {
		vi.clearAllMocks();
		mockedGetPrismaConstraintFields.mockReturnValue([]);
	});

	describe("sendMessage", () => {
		it("should create and return the message successfully", async () => {
			mockedCreate.mockResolvedValue(createdMessageFromDatabase as any);

			const result = await service.sendMessage(
				senderId,
				receiverId,
				content,
			);

			expect(mockedCreate).toHaveBeenCalledWith({
				data: {
					senderId,
					receiverId,
					content,
				},
			});
			expect(result).toEqual(createdMessageFromDatabase);
		});

		it("should throw InvalidIdError when Prisma returns P2007", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2007"));

			await expect(
				service.sendMessage(senderId, receiverId, content),
			).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("should throw UnknownUserIdError on P2025 when senderId is in constraint fields", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["senderId"]);

			await expect(
				service.sendMessage(senderId, receiverId, content),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("should throw UnknownUserIdError on P2025 when receiverId is in constraint fields", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["receiverId"]);

			await expect(
				service.sendMessage(senderId, receiverId, content),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("should throw UnknownElementError with specific field on P2025 when another field fails", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["chatRoomId"]);

			await expect(
				service.sendMessage(senderId, receiverId, content),
			).rejects.toMatchObject({
				name: "UnknownElementError",
				message: expect.stringContaining("chatRoomId"),
			});
		});

		it("should throw UnknownElementError with 'unknown' on P2025 when no fields are returned", async () => {
			mockedCreate.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue([]);

			await expect(
				service.sendMessage(senderId, receiverId, content),
			).rejects.toMatchObject({
				name: "UnknownElementError",
				message: expect.stringContaining("unknown"),
			});
		});

		it("should rethrow unhandled errors", async () => {
			const unexpectedError = new Error("Database connection lost");
			mockedCreate.mockRejectedValue(unexpectedError);

			await expect(
				service.sendMessage(senderId, receiverId, content),
			).rejects.toThrow("Database connection lost");
		});
	});

	describe("getConversation", () => {
		const conversationMessages = [
			{
				uuid: "msg-1",
				senderId,
				receiverId,
				content: "Hello !",
				createdAt: new Date("2026-01-01T10:00:00Z"),
			},
			{
				uuid: "msg-2",
				senderId: receiverId,
				receiverId: senderId,
				content: "Hi, how are you?",
				createdAt: new Date("2026-01-01T10:01:00Z"),
			},
		];

		it("should return the conversation ordered by uuid ascending", async () => {
			mockedFindMany.mockResolvedValue(conversationMessages as any);

			const result = await service.getConversation(senderId, receiverId);

			expect(mockedFindMany).toHaveBeenCalledWith({
				where: {
					OR: [
						{
							senderId,
							receiverId,
						},
						{
							senderId: receiverId,
							receiverId: senderId,
						},
					],
				},
				orderBy: { uuid: "asc" },
			});
			expect(result).toEqual(conversationMessages);
		});

		it("should throw InvalidIdError when Prisma returns P2007", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2007"));

			await expect(
				service.getConversation(senderId, receiverId),
			).rejects.toMatchObject({
				name: "InvalidIdError",
			});
		});

		it("should throw UnknownUserIdError on P2025 when senderId is in constraint fields", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["senderId"]);

			await expect(
				service.getConversation(senderId, receiverId),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("should throw UnknownUserIdError on P2025 when receiverId is in constraint fields", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["receiverId"]);

			await expect(
				service.getConversation(senderId, receiverId),
			).rejects.toMatchObject({
				name: "UnknownUserIdError",
			});
		});

		it("should throw UnknownElementError with specific field on P2025 when another field fails", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue(["someOtherField"]);

			await expect(
				service.getConversation(senderId, receiverId),
			).rejects.toMatchObject({
				name: "UnknownElementError",
				message: expect.stringContaining("someOtherField"),
			});
		});

		it("should throw UnknownElementError with 'unknown' on P2025 when no fields are returned", async () => {
			mockedFindMany.mockRejectedValue(createPrismaError("P2025"));
			mockedGetPrismaConstraintFields.mockReturnValue([]);

			await expect(
				service.getConversation(senderId, receiverId),
			).rejects.toMatchObject({
				name: "UnknownElementError",
				message: expect.stringContaining("unknown"),
			});
		});

		it("should rethrow unhandled errors", async () => {
			const unexpectedError = new Error("Database timeout");
			mockedFindMany.mockRejectedValue(unexpectedError);

			await expect(
				service.getConversation(senderId, receiverId),
			).rejects.toThrow("Database timeout");
		});
	});
});
