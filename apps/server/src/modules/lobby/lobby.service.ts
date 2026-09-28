import { CreateLobbyDTO } from "@ft_transcendence/shared";
//import { Prisma } from "../../generated/prisma/client";
//import { prisma } from "../../lib/prisma.lib";
import { v7 as uuidv7 } from 'uuid';
import { LobbyEntity } from "./lobby.mapper";

export const lobbiesByJoinCode = new Map<string, LobbyEntity>();

function generateJoinCode(): string {
    let joinCode: string;

    do {
        joinCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
    } while (lobbiesByJoinCode.has(joinCode));

    return joinCode;
}

export class LobbyService {
	async createLobby(hostId: string, data: CreateLobbyDTO): Promise<LobbyEntity> { // LobbyEntity to check
		//add try catch here
			const code = generateJoinCode();
			const lobby: LobbyEntity = {
				uuid: uuidv7(),
				joinCode: code,
				hostId: hostId,
				mode: data.mode,
				visibility: data.visibility,
				settings: data.settings,
				createdAt: new Date(),
				maxPlayers: data.maxPlayers,
			};
			lobbiesByJoinCode.set(code, lobby);
			return lobby;
	}
}


export const lobbyService = new LobbyService();
