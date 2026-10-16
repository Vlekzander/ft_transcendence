import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getMsgHistory,
	getMsgPreview,
	handleMessage,
} from "@/modules/msg/msg.controller";
import { msgService } from "@/modules/msg/msg.service";
import { getTokenUuid } from "@/middlewares/auth.middleware";
import { sendToWs } from "@/websocket.server";
import {
	createReceiveMessagePacket,
	toMessageDTO,
} from "@ft_transcendence/shared";
import { toPublicUserDTO } from "@/modules/shared/shared.mapper";

vi.mock("@/modules/msg/msg.service", () => ({
	msgService: {
		sendMessage: vi.fn(),
		getConversation: vi.fn(),
		getPreview: vi.fn(),
	},
}));

vi.mock("@/middlewares/auth.middleware", () => ({
	getTokenUuid: vi.fn(),
}));

vi.mock("@/websocket.server", () => ({
	sendToWs: vi.fn(),
}));

vi.mock("@/modules/shared/shared.mapper", () => ({
	toPublicUserDTO: vi.fn((user) => user),
}));

vi.mock("@ft_transcendence/shared", async () => {
	const actual = await vi.importActual<
		typeof import("@ft_transcendence/shared")
	>("@ft_transcendence/shared");
	return {
		...actual,
		createReceiveMessagePacket: vi.fn(),
		toMessageDTO: vi.fn((uuid, senderId, receiverId, content) => ({
			uuid,
			senderId,
			receiverId,
			content,
		})),
	};
});

const mockedGetTokenUuid = vi.mocked(getTokenUuid);
const mockedGetConversation = vi.mocked(msgService.getConversation);
const mockedGetPreview = vi.mocked(msgService.getPreview);
const mockedSendMessage = vi.mocked(msgService.sendMessage);
const mockedSendToWs = vi.mocked(sendToWs);
const mockedCreateReceiveMessagePacket = vi.mocked(createReceiveMessagePacket);
const mockedToMessageDTO = vi.mocked(toMessageDTO);
const mockedToPublicUserDTO = vi.mocked(toPublicUserDTO);

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
		it("transforms database records via toMessageDTO and returns HTTP 200", async () => {
			const rawMessages = [
				{
					uuid: "m-1",
					senderId: "u-1",
					receiverId: "u-2",
					content: "Hello",
					createdAt: new Date(),
				},
			];
			mockedGetTokenUuid.mockReturnValue("u-1");
			mockedGetConversation.mockResolvedValue(rawMessages as any);

			const req = { parsedParams: { uuid: "u-2" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getMsgHistory(req, res as any, next);

			expect(mockedToMessageDTO).toHaveBeenCalledWith(
				"m-1",
				"u-1",
				"u-2",
				"Hello",
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				messages: [
					{
						uuid: "m-1",
						senderId: "u-1",
						receiverId: "u-2",
						content: "Hello",
					},
				],
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("forwards RequireAuthError when sender token is missing", async () => {
			mockedGetTokenUuid.mockReturnValue(undefined);

			const req = { parsedParams: { uuid: "u-2" } } as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getMsgHistory(req, res as any, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
		});
	});

	describe("getMsgPreview", () => {
		it("transforms preview records via toMessageDTO and toPublicUserDTO and returns HTTP 200", async () => {
			const rawMessages = [
				{
					uuid: "m-1",
					senderId: "u-1",
					receiverId: "u-2",
					content: "Hello",
					sender: {
						uuid: "u-1",
						username: "user1",
						avatarPath: "path1",
					},
					receiver: {
						uuid: "u-2",
						username: "user2",
						avatarPath: "path2",
					},
					createdAt: new Date(),
				},
			];
			mockedGetTokenUuid.mockReturnValue("u-1");
			mockedGetPreview.mockResolvedValue(rawMessages as any);

			const req = {} as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getMsgPreview(req, res as any, next);

			expect(mockedToMessageDTO).toHaveBeenCalledWith(
				"m-1",
				"u-1",
				"u-2",
				"Hello",
			);
			expect(mockedToPublicUserDTO).toHaveBeenCalledTimes(2);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalledWith({
				preview: [
					{
						message: {
							uuid: "m-1",
							senderId: "u-1",
							receiverId: "u-2",
							content: "Hello",
						},
						sender: {
							uuid: "u-1",
							username: "user1",
							avatarPath: "path1",
						},
						receiver: {
							uuid: "u-2",
							username: "user2",
							avatarPath: "path2",
						},
					},
				],
			});
			expect(next).not.toHaveBeenCalled();
		});

		it("forwards RequireAuthError when sender token is missing", async () => {
			mockedGetTokenUuid.mockReturnValue(undefined);

			const req = {} as any;
			const res = createResponseMock();
			const next = vi.fn();

			await getMsgPreview(req, res as any, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
		});
	});

	describe("handleMessage (websocket)", () => {
		it("broadcasts generated packet to both sender and receiver", async () => {
			const ws = { uuid: "sender-1" } as any;
			const packet = { receiver: "recv-2", content: "Salut !" } as any;

			mockedSendMessage.mockResolvedValue({
				uuid: "msg-99",
				senderId: "sender-1",
				receiverId: "recv-2",
				content: "Salut !",
			} as any);

			const packetResponse = { type: "RECEIVE_MESSAGE", uuid: "msg-99" };
			mockedCreateReceiveMessagePacket.mockReturnValue(
				packetResponse as any,
			);

			await handleMessage(ws, packet);

			expect(mockedSendMessage).toHaveBeenCalledWith(
				"sender-1",
				"recv-2",
				"Salut !",
			);
			expect(mockedSendToWs).toHaveBeenCalledWith(
				"sender-1",
				packetResponse,
			);
			expect(mockedSendToWs).toHaveBeenCalledWith(
				"recv-2",
				packetResponse,
			);
		});

		it("throws RequireAuthError if ws has empty uuid", async () => {
			const ws = { uuid: "" } as any;
			const packet = { receiver: "recv-2", content: "Test" } as any;

			await expect(handleMessage(ws, packet)).rejects.toMatchObject({
				name: "RequireAuthError",
			});
		});

		it("throws SelfMessageError if sender and receiver are identical", async () => {
			const ws = { uuid: "same-user" } as any;
			const packet = { receiver: "same-user", content: "Self" } as any;

			await expect(handleMessage(ws, packet)).rejects.toMatchObject({
				name: "SelfMessageError",
			});
		});
	});
});
