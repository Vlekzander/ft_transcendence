import {
	getTokenUuid,
	requireAuth,
	requireGuest,
	requireUserOwnership,
} from "@/middlewares/auth.middleware";
import { validateAccessToken } from "@/utils/jwt.util";
import { sharedService } from "@/modules/shared/shared.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/jwt.util", () => ({
	validateAccessToken: vi.fn(),
}));

vi.mock("@/modules/shared/shared.service", () => ({
	sharedService: {
		getUserById: vi.fn(),
	},
}));

const mockedValidateAccessToken = vi.mocked(validateAccessToken);
const mockedGetUserById = vi.mocked(sharedService.getUserById);

function createMockReqRes(
	options: {
		cookies?: Record<string, string>;
		params?: Record<string, string>;
	} = {},
) {
	const req = {
		cookies: options.cookies ?? {},
		params: options.params ?? {},
	} as any;
	const res = {} as any;
	const next = vi.fn();
	return { req, res, next };
}

describe("auth.middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getTokenUuid", () => {
		it("returns undefined if req.cookies is undefined", () => {
			const req = {} as any;
			expect(getTokenUuid(req)).toBeUndefined();
		});

		it("returns undefined if token cookie is missing", () => {
			const { req } = createMockReqRes({ cookies: {} });
			expect(getTokenUuid(req)).toBeUndefined();
		});

		it("returns undefined if validateAccessToken throws", () => {
			mockedValidateAccessToken.mockImplementation(() => {
				throw new Error("Invalid JWT");
			});
			const { req } = createMockReqRes({
				cookies: { token: "bad-token" },
			});
			expect(getTokenUuid(req)).toBeUndefined();
		});

		it("returns string sub from payload", () => {
			mockedValidateAccessToken.mockReturnValue({
				sub: "user-123",
			} as any);
			const { req } = createMockReqRes({
				cookies: { token: "valid-token" },
			});
			expect(getTokenUuid(req)).toBe("user-123");
		});

		it("casts numeric sub to string", () => {
			mockedValidateAccessToken.mockReturnValue({ sub: 12345 } as any);
			const { req } = createMockReqRes({
				cookies: { token: "valid-token" },
			});
			expect(getTokenUuid(req)).toBe("12345");
		});
	});

	describe("requireGuest", () => {
		it("calls next() with AlreadyAuthError if user is authenticated and exists", async () => {
			mockedValidateAccessToken.mockReturnValue({
				sub: "user-123",
			} as any);
			mockedGetUserById.mockResolvedValue({ id: "user-123" } as any);

			const { req, res, next } = createMockReqRes({
				cookies: { token: "valid-token" },
			});

			await requireGuest(req, res, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "AlreadyAuthError",
			});
		});

		it("calls next() without error if user is unauthenticated", async () => {
			const { req, res, next } = createMockReqRes();

			await requireGuest(req, res, next);

			expect(next).toHaveBeenCalledWith();
		});

		it("calls next() without error if token is valid but user does not exist in DB", async () => {
			mockedValidateAccessToken.mockReturnValue({
				sub: "user-unknown",
			} as any);
			mockedGetUserById.mockResolvedValue(null);

			const { req, res, next } = createMockReqRes({
				cookies: { token: "valid-token" },
			});

			await requireGuest(req, res, next);

			expect(next).toHaveBeenCalledWith();
		});
	});

	describe("requireAuth", () => {
		it("calls next() without error when authenticated and user exists", async () => {
			mockedValidateAccessToken.mockReturnValue({
				sub: "user-123",
			} as any);
			mockedGetUserById.mockResolvedValue({ id: "user-123" } as any);

			const { req, res, next } = createMockReqRes({
				cookies: { token: "valid-token" },
			});

			await requireAuth(req, res, next);

			expect(next).toHaveBeenCalledWith();
		});

		it("calls next() with RequireAuthError when not authenticated", async () => {
			const { req, res, next } = createMockReqRes();

			await requireAuth(req, res, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
		});

		it("calls next() with RequireAuthError when token is valid but user is missing in DB", async () => {
			mockedValidateAccessToken.mockReturnValue({
				sub: "deleted-user",
			} as any);
			mockedGetUserById.mockResolvedValue(null);

			const { req, res, next } = createMockReqRes({
				cookies: { token: "valid-token" },
			});

			await requireAuth(req, res, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
		});
	});

	describe("requireUserOwnership", () => {
		it("calls next() with RequireAuthError if token cookie is absent", () => {
			const { req, res, next } = createMockReqRes({
				params: { uuid: "user-1" },
			});

			requireUserOwnership(req, res, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
		});

		it("calls next() with RequireAuthError if token validation fails", () => {
			mockedValidateAccessToken.mockImplementation(() => {
				throw new Error("Malformed JWT");
			});
			const { req, res, next } = createMockReqRes({
				cookies: { token: "corrupt" },
				params: { uuid: "user-1" },
			});

			requireUserOwnership(req, res, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "RequireAuthError",
			});
		});

		it("calls next() with CannotEditUserError if sub does not match params.uuid", () => {
			mockedValidateAccessToken.mockReturnValue({ sub: "user-1" } as any);
			const { req, res, next } = createMockReqRes({
				cookies: { token: "valid-token" },
				params: { uuid: "user-2" },
			});

			requireUserOwnership(req, res, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next.mock.calls[0][0]).toMatchObject({
				name: "CannotEditUserError",
			});
		});

		it("calls next() without error when sub matches params.uuid", () => {
			mockedValidateAccessToken.mockReturnValue({ sub: "user-1" } as any);
			const { req, res, next } = createMockReqRes({
				cookies: { token: "valid-token" },
				params: { uuid: "user-1" },
			});

			requireUserOwnership(req, res, next);

			expect(next).toHaveBeenCalledWith();
		});
	});
});
