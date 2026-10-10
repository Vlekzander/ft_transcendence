import { describe, expect, it } from "vitest";
import {
	CannotBanHostError,
	InvalidElementError,
	LobbyFullError,
	LobbyNotFoundError,
	NoWordsErrorInCustomWords,
	NotHostError,
	TooManyCustomWordsError,
	UnauthorizedLobbyAccessError,
	UnauthorizedUserActionError,
	UserAlreadyInLobbyError,
	UserBannedFromLobbyError,
	UserNotInLobbyError,
} from "@/errors";
import { mapError } from "@/middlewares/errorHandler.middleware";

describe("middlewares/errorHandler.middleware (lobby errors)", () => {
	it.each([
		["NoWordsErrorInCustomWords", new NoWordsErrorInCustomWords(), 400],
		["TooManyCustomWordsError", new TooManyCustomWordsError(), 400],
		[
			"InvalidElementError (dictionary)",
			new InvalidElementError("Dictionary"),
			400,
		],
		["CannotBanHostError", new CannotBanHostError(), 400],
		["NotHostError", new NotHostError(), 403],
		[
			"UnauthorizedLobbyAccessError",
			new UnauthorizedLobbyAccessError(),
			403,
		],
		["UnauthorizedUserActionError", new UnauthorizedUserActionError(), 403],
		["UserBannedFromLobbyError", new UserBannedFromLobbyError(), 403],
		["LobbyNotFoundError", new LobbyNotFoundError(), 404],
		["UserNotInLobbyError", new UserNotInLobbyError(), 404],
		["LobbyFullError", new LobbyFullError(), 409],
		["UserAlreadyInLobbyError", new UserAlreadyInLobbyError(), 409],
	])("Maps %s to HTTP %i", (_name, error, status) => {
		expect(mapError(error)).toEqual({
			status,
			code: error.name,
			message: error.message,
		});
	});
});
