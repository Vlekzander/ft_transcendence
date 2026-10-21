import {
	CreateLobbySchema,
	LobbyParamsSchema,
	JoinLobbySchema,
	UpdateLobbySchema,
	LobbyPlayerBodySchema,
} from "@ft_transcendence/shared";
import { ParsedRequest } from "../../middlewares/validate.middleware";
import { NextFunction, Request, Response } from "express";
import { toLobbyResponseDTO } from "./lobby.mapper";
import {
	LobbyNotFoundError,
	RequireAuthError,
	UnauthorizedLobbyAccessError,
} from "@/errors";
import { lobbyService } from "./lobby.service";
import { getTokenUuid } from "@/middlewares/auth.middleware";

type CreateLobbyRequest = ParsedRequest<{ body: typeof CreateLobbySchema }>;

export async function createLobbyController(
	req: CreateLobbyRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = getTokenUuid(req);
		if (!userId) throw new RequireAuthError();
		const data = req.parsedBody!;
		const lobby = await lobbyService.createLobby(userId, data);
		const dto = toLobbyResponseDTO(lobby);
		res.status(201).json({ data: dto });
	} catch (err) {
		next(err);
	}
}

export async function listLobbiesController(
	_req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const lobbies = await lobbyService.listLobbies();
		const dtos = lobbies.map((lobby) => toLobbyResponseDTO(lobby));
		res.status(200).json({ data: dtos });
	} catch (err) {
		next(err);
	}
}

export async function getByUuidLobbyController(
	req: ParsedRequest<{ params: typeof LobbyParamsSchema }>,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = getTokenUuid(req);
		if (!userId) throw new RequireAuthError();
		const { uuid } = req.parsedParams!;
		const lobby = await lobbyService.getLobbyByUuid(uuid);
		if (!lobby) throw new LobbyNotFoundError();
		if (!lobby.connectedPlayers.has(userId))
			throw new UnauthorizedLobbyAccessError();
		const dto = toLobbyResponseDTO(lobby, lobby.hostId === userId);
		res.status(200).json({ data: dto });
	} catch (err) {
		next(err);
	}
}

export async function joinLobbyController(
	req: ParsedRequest<{ body: typeof JoinLobbySchema }>,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = getTokenUuid(req);
		if (!userId) throw new RequireAuthError();
		const { joinCode } = req.parsedBody!;
		const lobby = await lobbyService.getLobbyByJoinCode(joinCode);
		if (!lobby) {
			throw new LobbyNotFoundError();
		}
		await lobbyService.joinLobby(lobby.uuid, userId);
		const dto = toLobbyResponseDTO(lobby);
		res.status(200).json({ data: dto });
	} catch (err) {
		next(err);
	}
}

export async function leaveLobbyController(
	req: ParsedRequest<{ params: typeof LobbyParamsSchema }>,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = getTokenUuid(req);
		if (!userId) throw new RequireAuthError();
		const { uuid: lobbyUuid } = req.parsedParams!;
		await lobbyService.leaveLobby(lobbyUuid, userId);
		res.status(200).json({ message: "Left lobby successfully" });
	} catch (err) {
		next(err);
	}
}

export async function toggleReadyController(
	req: ParsedRequest<{ params: typeof LobbyParamsSchema }>,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = getTokenUuid(req);
		if (!userId) throw new RequireAuthError();
		const lobby = await lobbyService.toggleReady(
			req.parsedParams!.uuid,
			userId,
		);
		res.status(200).json({ data: toLobbyResponseDTO(lobby) });
	} catch (err) {
		next(err);
	}
}

export async function startGameController(
	req: ParsedRequest<{ params: typeof LobbyParamsSchema }>,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = getTokenUuid(req);
		if (!userId) throw new RequireAuthError();
		const lobby = await lobbyService.toggleGame(
			req.parsedParams!.uuid,
			userId,
		);
		res.status(200).json({ data: toLobbyResponseDTO(lobby) });
	} catch (err) {
		next(err);
	}
}

export async function updateLobbyController(
	req: ParsedRequest<{
		params: typeof LobbyParamsSchema;
		body: typeof UpdateLobbySchema;
	}>,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = getTokenUuid(req);
		if (!userId) throw new RequireAuthError();
		const { uuid: lobbyUuid } = req.parsedParams!;
		const updatedData = req.parsedBody!;
		const lobby = await lobbyService.updateLobby(
			lobbyUuid,
			updatedData,
			userId,
		);
		const dto = toLobbyResponseDTO(lobby, lobby.hostId === userId);
		res.status(200).json({ data: dto });
	} catch (err) {
		next(err);
	}
}

export async function banLobbyController(
	req: ParsedRequest<{
		params: typeof LobbyParamsSchema;
		body: typeof LobbyPlayerBodySchema;
	}>,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = getTokenUuid(req);
		if (!userId) throw new RequireAuthError();
		const { uuid: lobbyUuid } = req.parsedParams!;
		const { userId: targetUserId } = req.parsedBody!;
		await lobbyService.banLobby(lobbyUuid, userId, targetUserId);
		res.status(200).json({ message: "Lobby banned successfully" });
	} catch (err) {
		next(err);
	}
}

export async function unbanLobbyController(
	req: ParsedRequest<{
		params: typeof LobbyParamsSchema;
		body: typeof LobbyPlayerBodySchema;
	}>,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = getTokenUuid(req);
		if (!userId) throw new RequireAuthError();
		const { uuid: lobbyUuid } = req.parsedParams!;
		const { userId: targetUserId } = req.parsedBody!;
		await lobbyService.unbanLobby(lobbyUuid, userId, targetUserId);
		res.status(200).json({ message: "Lobby unbanned successfully" });
	} catch (err) {
		next(err);
	}
}

export async function getMyLobbyController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const userId = getTokenUuid(req);
		if (!userId) throw new RequireAuthError();
		const lobby = await lobbyService.getLobbyOfUser(userId);
		res.status(200).json({
			data: lobby ? toLobbyResponseDTO(lobby) : null,
		});
	} catch (err) {
		next(err);
	}
}
