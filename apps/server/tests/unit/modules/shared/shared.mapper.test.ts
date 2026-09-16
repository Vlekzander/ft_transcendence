import {
	toPublicUserDTO,
	toUserResponseDTO,
	UserEntity,
} from "@/modules/shared/shared.mapper";
import { describe, expect, it } from "vitest";

const user: UserEntity = {
	uuid: "user-uuid",
	email: "user@email.com",
	username: "user",
	avatarPath: null,
	createdAt: new Date("2026-01-01"),
};

describe("shared/shared.mapper", () => {
	it("Converts a UserEntity into a UserResponseDTO", () => {
		// Arrange

		// Act
		const result = toUserResponseDTO(user);

		// Assert
		expect(result).toEqual({
			uuid: user.uuid,
			email: user.email,
			username: user.username,
			avatarPath: user.avatarPath,
		});
	});

	it("Converts a UserEntity into a PublicUserDTO", () => {
		// Arrange

		// Act
		const result = toPublicUserDTO(user);

		// Assert
		expect(result).toEqual({
			uuid: user.uuid,
			username: user.username,
			avatarPath: user.avatarPath,
			online: false,
		});
	});
});
