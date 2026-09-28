import { describe, expect, it, vi } from "vitest";
import { registerPacketHandler } from "@/websocket.server";
import * as MsgSocketController from "@/modules/msg/msg.controller";
import { registerMsgSockets } from "@/modules/msg/msg.socket";
import { registerAllSockets } from "@/socket";

vi.mock("@/websocket.server", () => ({
	registerPacketHandler: vi.fn(),
}));

describe("msg.socket & socket registration", () => {
	it("registers SEND_MESSAGE with handleMessage", () => {
		registerMsgSockets();

		expect(registerPacketHandler).toHaveBeenCalledWith(
			"SEND_MESSAGE",
			MsgSocketController.handleMessage,
		);
	});

	it("registerAllSockets invokes all domain socket registrations", () => {
		registerAllSockets();
		expect(registerPacketHandler).toHaveBeenCalledWith(
			"SEND_MESSAGE",
			expect.any(Function),
		);
	});
});
