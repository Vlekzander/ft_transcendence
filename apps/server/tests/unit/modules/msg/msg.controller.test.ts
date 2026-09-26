import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMsgHistory, handleMessage } from "@/modules/msg/msg.controller";
import { msgService } from "@/modules/msg/msg.service";
import { getTokenUuid } from "@/middlewares/auth.middleware";
import { sendToWs } from "@/websocket.server";
import { createReceiveMessagePacket } from "@ft_transcendence/shared";

vi.mock("@/modules/msg/msg.service", () => ({
	msgService: {
		sendMessage: vi.fn(),
		getConversation: vi.fn(),
	},
}));

vi.mock("@/middlewares/auth.middleware", () => ({
	getTokenUuid: vi.fn(),
}));

vi.mock("@/websocket.server", () => ({
	sendToWs: vi.fn(),
}));

vi.mock("@ft_transcendence/shared", async () => {
	const actual = await vi.importActual<
		typeof import("@ft_transcendence/shared")
	>("@ft_transcendence/shared");
	return {
		...actual,
		createReceiveMessagePacket: vi.fn(),
	};
});

const mockedGetTokenUuid = vi.mocked(getTokenUuid);
const mockedGetConversation = vi.mocked(msgService.getConversation);
const mockedSendMessage = vi.mocked(msgService.sendMessage);
const mockedSendToWs = vi.mocked(sendToWs);
const mockedCreateReceiveMessagePacket = vi.mocked(createReceiveMessagePacket);

function createResponseMock() {
	const res = {
		status: vi.fn(),
		send: vi.fn(),
	};
	res.status.mockReturnValue(res);
	res.send.mockReturnValue(res);
	return res;
}

describe("msg/msg.controller", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getMsgHistory", () => {
		it("should return chat history with HTTP 200", async () => {
			const chatHistory = [
				{
					uuid: "msg-1",
					senderId: "sender-uuid",
					receiverId: "receiver-uuid",
					content: "Hello world!",
					createdAt: new Date("2026-01-01"),
				},
			];

			mockedGetTokenUuid.mockReturnValue("sender-uuid");
			mockedGetConversation.mockResolvedValue(chatHistory as any);

			const req = {
				parsedParams: { uuid: "receiver-uuid" },
			} as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getMsgHistory(req, res as any, next);

			expect(mockedGetTokenUuid).toHaveBeenCalledWith(req);
			expect(mockedGetConversation).toHaveBeenCalledWith(
				"sender-uuid",
				"receiver-uuid",
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({ chatHistory });
			expect(next).not.toHaveBeenCalled();
		});

		it("should forward RequireAuthError to next when sender is missing", async () => {
			mockedGetTokenUuid.mockReturnValue(null as any);

			const req = {
				parsedParams: { uuid: "receiver-uuid" },
			} as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getMsgHistory(req, res as any, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
			expect(mockedGetConversation).not.toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it("should forward service errors to next", async () => {
			const error = new Error("Database query failed");
			mockedGetTokenUuid.mockReturnValue("sender-uuid");
			mockedGetConversation.mockRejectedValue(error);

			const req = {
				parsedParams: { uuid: "receiver-uuid" },
			} as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getMsgHistory(req, res as any, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("handleMessage (websocket)", () => {
		it("should process message and broadcast packet to sender and receiver", async () => {
			const ws = { uuid: "sender-uuid" } as any;
			const packet = {
				receiver: "receiver-uuid",
				content: "Hello from WS!",
			} as any;

			const createdMessage = {
				uuid: "msg-123",
				senderId: "sender-uuid",
				receiverId: "receiver-uuid",
				content: "Hello from WS!",
			};
			const expectedPacket = {
				type: "RECEIVE_MESSAGE",
				uuid: "msg-123",
				sender: "sender-uuid",
				receiverId: "receiver-uuid",
				content: "Hello from WS!",
			};

			mockedSendMessage.mockResolvedValue(createdMessage as any);
			mockedCreateReceiveMessagePacket.mockReturnValue(
				expectedPacket as any,
			);

			await handleMessage(ws, packet);

			expect(mockedSendMessage).toHaveBeenCalledWith(
				"sender-uuid",
				"receiver-uuid",
				"Hello from WS!",
			);
			expect(mockedCreateReceiveMessagePacket).toHaveBeenCalledWith(
				"msg-123",
				"sender-uuid",
				"receiver-uuid",
				"Hello from WS!",
			);
			expect(mockedSendToWs).toHaveBeenCalledWith(
				"sender-uuid",
				expectedPacket,
			);
			expect(mockedSendToWs).toHaveBeenCalledWith(
				"receiver-uuid",
				expectedPacket,
			);
		});

		it("should throw RequireAuthError when ws has no uuid", async () => {
			const ws = { uuid: undefined } as any;
			const packet = {
				receiver: "receiver-uuid",
				content: "Hello",
			} as any;

			await expect(handleMessage(ws, packet)).rejects.toMatchObject({
				name: "RequireAuthError",
			});
			expect(mockedSendMessage).not.toHaveBeenCalled();
		});

		it("should throw SelfMessageError when sender and receiver are identical", async () => {
			const ws = { uuid: "user-uuid" } as any;
			const packet = {
				receiver: "user-uuid",
				content: "Hello to myself",
			} as any;

			await expect(handleMessage(ws, packet)).rejects.toMatchObject({
				name: "SelfMessageError",
			});
			expect(mockedSendMessage).not.toHaveBeenCalled();
		});
	});
});
