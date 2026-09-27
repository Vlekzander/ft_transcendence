import { CreateLobbySchema } from "@ft_transcendence/shared";
import { ParsedRequest } from "../../middlewares/validate.middleware";
import { CookieOptions, NextFunction, Request, Response } from "express";
import { toLobbyResponseDTO } from "./lobby.mapper";
import { lobbyService } from "./lobby.service";

type LobbyBody = typeof CreateLobbySchema;

type LobbyRequest<T extends LobbyBody = LobbyBody> = ParsedRequest<{ body: T }>;

export async function createLobby(
	req: LobbyRequest<typeof CreateLobbySchema>,
	res: Response,
	next: NextFunction,
) {
	try {
		const data = req.parsedBody!;
		const user = await lobbyService.createLobby(data);
		const dto = toLobbyResponseDTO(user);

		res.status(201).json({ data: dto });
	} catch (err) {
		next(err);
	}
}
/*
export async function Lobby(
	req: LobbyRequest<typeof CreateLobbySchema>,
	res: Response,
	next: NextFunction,
) {
	try {
		const data = req.parsedBody!;
		const user = await lobbyService.createLobby(data);
		const dto = toLobbyResponseDTO(user);

		res.status(201).json({ data: dto });
	} catch (err) {
		next(err);
	}
}*/