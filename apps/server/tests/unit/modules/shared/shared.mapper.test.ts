import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	toPublicUserDTO,
	toUserResponseDTO,
	UserEntity,
} from "@/modules/shared/shared.mapper";
import { isUserOnline } from "@/websocket.server";

vi.mock("@/websocket.server", () => ({
	isUserOnline: vi.fn(),
}));

const mockedIsUserOnline = vi.mocked(isUserOnline);

const user: UserEntity = {
	uuid: "user-uuid",
	email: "user@email.com",
	username: "user",
	avatarPath: null,
	createdAt: new Date("2026-01-01"),
};

describe("shared/shared.mapper", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Converts a UserEntity into a UserResponseDTO", () => {
		const result = toUserResponseDTO(user);

		expect(result).toEqual({
			uuid: user.uuid,
			email: user.email,
			username: user.username,
			avatarPath: user.avatarPath,
		});
	});

	it("Converts a UserEntity into a PublicUserDTO when offline", () => {
		mockedIsUserOnline.mockReturnValue(false);

		const result = toPublicUserDTO(user);

		expect(mockedIsUserOnline).toHaveBeenCalledWith(user.uuid);
		expect(result).toEqual({
			uuid: user.uuid,
			username: user.username,
			avatarPath: user.avatarPath,
			online: false,
		});
	});

	it("Converts a UserEntity into a PublicUserDTO when online", () => {
		mockedIsUserOnline.mockReturnValue(true);

		const result = toPublicUserDTO(user);

		expect(mockedIsUserOnline).toHaveBeenCalledWith(user.uuid);
		expect(result).toEqual({
			uuid: user.uuid,
			username: user.username,
			avatarPath: user.avatarPath,
			online: true,
		});
	});
});
