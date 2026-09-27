import { CreateLobbySchema, toLobbyResponseDTO } from "@ft_transcendence/shared";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma.lib";
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
	async createLobby(data: CreateLobbySchema): Promise<LobbyEntity> { // LobbyEntity to check
		try {
			const code = generateJoinCode();
			const result = {
				id: uuidv7(),
				createdAt: new Date(),
				joinCode: code,
				name: data.name,
				maxPlayers: data.maxPlayers,
			};

			return toLobbyResponseDTO(result);
		} catch (error) {
			////
		}
		return Promise.reject(new Error("Failed to create lobby"));
	}
}


export const lobbyService = new LobbyService();
