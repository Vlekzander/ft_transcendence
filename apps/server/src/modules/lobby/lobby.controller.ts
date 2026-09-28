import { CreateLobbySchema } from "@ft_transcendence/shared";
import { ParsedRequest } from "../../middlewares/validate.middleware";
import { NextFunction, Response } from "express";
import { validateAccessToken } from "../../utils/jwt.util";
import { toLobbyResponseDTO } from "./lobby.mapper";
import { lobbyService } from "./lobby.service";

type LobbyBody = typeof CreateLobbySchema;

type LobbyRequest = ParsedRequest<{ body: typeof CreateLobbySchema }>;

export async function createLobbyController(
	req: LobbyRequest,
	res: Response,
	next: NextFunction,
) {
	try {
		const token = req.cookies?.token;
		if (!token) {
			throw new Error("Authentication required");
		}
		const payload = validateAccessToken(token);
		if (typeof payload === "string") {
			throw new Error("Invalid token");
		}
		const data = req.parsedBody!;
		const lobby = await lobbyService.createLobby(payload.sub, data);
		const dto = toLobbyResponseDTO(lobby);

		res.status(201).json({ data: dto });
	} catch (err) {
		next(err);
	}
}