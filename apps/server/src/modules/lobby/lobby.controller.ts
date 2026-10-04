import {
	CreateLobbySchema,
	LobbyParamsSchema,
	JoinLobbySchema,
	UpdateLobbySchema,
} from "@ft_transcendence/shared";
import { ParsedRequest } from "../../middlewares/validate.middleware";
import { NextFunction, Response } from "express";
import { validateAccessToken } from "../../utils/jwt.util";
import type { JwtPayload } from "jsonwebtoken";
import { toLobbyResponseDTO } from "./lobby.mapper";
import { InvalidTokenError, LobbyNotFoundError } from "@/errors";
import { lobbyService } from "./lobby.service";

type CreateLobbyRequest = ParsedRequest<{ body: typeof CreateLobbySchema }>;

function checkPayload(
	payload: string | JwtPayload,
): asserts payload is JwtPayload & { sub: string } {
	if (typeof payload === "string" || typeof payload.sub !== "string") {
		throw new InvalidTokenError();
	}
}

export async function createLobbyController(
	req: CreateLobbyRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		if (!req.cookies?.token) throw new InvalidTokenError();
		const payload = validateAccessToken(req.cookies?.token);
		checkPayload(payload);
		const data = req.parsedBody!;
		const lobby = await lobbyService.createLobby(payload.sub, data);
		const dto = toLobbyResponseDTO(lobby);

		res.status(201).json({ data: dto });
	} catch (err) {
		next(err);
	}
}

export async function listLobbiesController(
	req: ParsedRequest<{}>,
	res: Response,
	next: NextFunction,
) {
	try {
		if (!req.cookies?.token) throw new InvalidTokenError();
		const payload = validateAccessToken(req.cookies?.token);
		checkPayload(payload);
		const lobbies = await lobbyService.listLobbies();
		const dtos = lobbies.map(toLobbyResponseDTO);
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
		if (!req.cookies?.token) throw new InvalidTokenError();
		const payload = validateAccessToken(req.cookies?.token);
		checkPayload(payload);
		const { uuid } = req.parsedParams!;
		const lobby = await lobbyService.getLobbyByUuid(uuid);
		if (!lobby) throw new LobbyNotFoundError();
		const dto = toLobbyResponseDTO(lobby);
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
		if (!req.cookies?.token) throw new InvalidTokenError();
		const payload = validateAccessToken(req.cookies?.token);
		checkPayload(payload);
		const { joinCode } = req.parsedBody!;
		const lobby = await lobbyService.getLobbyByJoinCode(joinCode);
		if (!lobby) {
			throw new LobbyNotFoundError();
		}
		await lobbyService.joinLobby(lobby.uuid, payload.sub);
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
		if (!req.cookies?.token) throw new InvalidTokenError();
		const { uuid: lobbyUuid } = req.parsedParams!;
		const payload = validateAccessToken(req.cookies?.token);
		checkPayload(payload);
		await lobbyService.leaveLobby(lobbyUuid, payload.sub);
		res.status(200).json({ message: "Left lobby successfully" });
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
		if (!req.cookies?.token) throw new InvalidTokenError();
		const { uuid: lobbyUuid } = req.parsedParams!;
		const payload = validateAccessToken(req.cookies?.token);
		checkPayload(payload);
		const updatedData = req.parsedBody!;
		const lobby = await lobbyService.updateLobby(
			lobbyUuid,
			updatedData,
			payload.sub,
		);
		const dto = toLobbyResponseDTO(lobby);
		res.status(200).json({ data: dto });
	} catch (err) {
		next(err);
	}
}
