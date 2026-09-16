import { isUserOnline } from "@/websocket.server";
import { AVATAR_DIR } from "../../config/upload.config";
import {
	DuplicateElementError,
	DuplicateEmailError,
	DuplicateUsernameError,
	InvalidIdError,
	UnknownUserIdError,
} from "../../errors";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma.lib";
import { generateHash } from "../../utils/hash.util";
import {
	getPrismaConstraintFields,
	sharedService,
	userDtoSelect,
} from "../shared/shared.service";
import { GameHistoryEntry, UpdateUserInput, UserEntity } from "./users.mapper";
import fs from "node:fs";

export class UsersService {
	async getUserHistory(uuid: string): Promise<GameHistoryEntry[]> {
		try {
			const result = await prisma.userOnGame.findMany({
				where: { userId: uuid },
				orderBy: { gameId: "desc" },
				include: {
					game: {
						include: {
							participants: {
								select: {
									userId: true,
									score: true,
									user: {
										select: {
											uuid: true,
											username: true,
											avatarPath: true,
										},
									},
								},
							},
						},
					},
				},
			});

			const history = result
				.filter((element) => element.game.status == "FINISHED")
				.map((element) => ({
					uuid: element.game.uuid,
					mode: element.game.mode,
					finished: element.game.status == "FINISHED",
					duration: element.game.duration,
					participants: element.game.participants.map((p) => ({
						userId: p.userId,
						score: p.score ?? 0,
						user: {
							uuid: p.user.uuid,
							username: p.user.username,
							avatarPath: p.user.avatarPath,
							online: isUserOnline(p.user.uuid),
						},
					})),
				}));

			return history;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
			}
			throw error;
		}
	}

	async updateUser(uuid: string, data: UpdateUserInput): Promise<UserEntity> {
		if (data.password !== undefined)
			data.password = await generateHash(data.password);

		try {
			const result = await prisma.user.update({
				where: { uuid: uuid },
				data: data,
				select: userDtoSelect,
			});

			return result;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
				if (error.code === "P2002") {
					const fields = getPrismaConstraintFields(error);
					if (fields.includes("email"))
						throw new DuplicateEmailError();
					if (fields.includes("username"))
						throw new DuplicateUsernameError();
					if (fields) throw new DuplicateElementError(fields[0]);
					throw new DuplicateElementError("Unknown");
				}
				throw error;
			}

			throw error;
		}
	}

	async updateUserAvatar(uuid: string, path: string): Promise<UserEntity> {
		try {
			const user = await sharedService.getUserById(uuid);

			if (!user) throw new UnknownUserIdError();

			const oldAvatarPath = user.avatarPath;

			const updated = await prisma.user.update({
				where: { uuid: uuid },
				data: { avatarPath: path },
				select: userDtoSelect,
			});

			if (oldAvatarPath) {
				const oldFullPath = `${AVATAR_DIR}/${oldAvatarPath}`;
				try {
					fs.unlinkSync(oldFullPath);
				} catch (error) {
					console.error("unlink avatar error:", error);
				}
			}

			return updated;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
			}
			throw error;
		}
	}
}

export const usersService = new UsersService();
