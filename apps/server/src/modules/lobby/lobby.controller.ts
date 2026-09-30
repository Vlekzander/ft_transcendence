import { CreateLobbySchema } from "@ft_transcendence/shared";
import { ParsedRequest } from "../../middlewares/validate.middleware";
import { NextFunction, Response } from "express";
import { validateAccessToken } from "../../utils/jwt.util";
import { toLobbyResponseDTO } from "./lobby.mapper";
import { lobbyService } from "./lobby.service";

type LobbyBody = typeof CreateLobbySchema;

type LobbyRequest = ParsedRequest<{ body: LobbyBody }>;

async function checkpayload(payload: any) {
	if (typeof payload === "string" || payload.sub !== "string")
		throw new Error("Invalid token");
}

export async function createLobbyController(
	req: LobbyRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const payload = validateAccessToken(req.cookies?.token);
		checkpayload(payload);
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
		const payload = validateAccessToken(req.cookies?.token);
		checkpayload(payload);
		const lobbies = await lobbyService.listLobbies();
		const dtos = lobbies.map(toLobbyResponseDTO);
		res.status(200).json({ data: dtos });
	} catch (err) {
		next(err);
	}
}

export async function getByUuidLobbyController(
	req: ParsedRequest<{ params: { uuid: string } }>,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid } = req.parsedParams!;
		const lobby = await lobbyService.getLobbyByUuid(uuid);
		if (!lobby) {
			res.status(404).json({ message: "Lobby not found" });
			return;
		}
		const dto = toLobbyResponseDTO(lobby);
		res.status(200).json({ data: dto });
	} catch (err) {
		next(err);
	}
}

export async function joinLobbyController(
	req: ParsedRequest<{ body: { joinCode: string } }>,
	res: Response,
	next: NextFunction,
) {
	try {
		const { joinCode } = req.parsedBody!;
		const lobby = await lobbyService.getLobbyByJoinCode(joinCode);
		if (!lobby) {
			res.status(404).json({ message: "Lobby not found" });
			return;
		}
		await lobbyService.joinLobby(lobby.uuid, req.parsedBody!.userId);
		const dto = toLobbyResponseDTO(lobby);
		res.status(200).json({ data: dto });
	} catch (err) {
		next(err);
	}
}

export async function leaveLobbyController(
	req: ParsedRequest<{ params: { uuid: string } }>,
	res: Response,
	next: NextFunction,
) {
	try {
		const { uuid: lobbyUuid } = req.parsedParams!;
		const payload = validateAccessToken(req.cookies?.token);
		checkpayload(payload);
		await lobbyService.leaveLobby(lobbyUuid, payload.sub);
		res.status(200).json({ message: "Left lobby successfully" });
	} catch (err) {
		next(err);
	}
}
