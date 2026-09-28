import { isUserOnline } from "@/websocket.server";
import { AVATAR_DIR } from "../../config/upload.config";
import {
	DuplicateElementError,
	DuplicateEmailError,
	DuplicateUsernameError,
	FriendshipAlreadyExistError,
	InvalidIdError,
	PendingFriendRequestExistError,
	SelfFriendRequestError,
	UnknownElementError,
	UnknownFriendRequestError,
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

	async getFriendships(uuid: string) {
		try {
			if ((await sharedService.getUserById(uuid)) === null)
				throw new UnknownUserIdError();
			const result = await prisma.friendship.findMany({
				where: {
					status: "ACCEPTED",
					OR: [{ senderId: uuid }, { receiverId: uuid }],
				},
				include: {
					sender: {
						select: userDtoSelect,
					},
					receiver: {
						select: userDtoSelect,
					},
				},
				orderBy: {
					uuid: "desc",
				},
			});

			const friendships = result.map((element) => ({
				uuid: element.uuid,
				user:
					uuid === element.senderId
						? element.receiver
						: element.sender,
			}));

			return friendships;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async getPendingFriendRequests(uuid: string) {
		try {
			const result = await prisma.friendship.findMany({
				where: {
					status: "PENDING",
					OR: [{ receiverId: uuid }],
				},
				include: {
					sender: {
						select: userDtoSelect,
					},
				},
				orderBy: {
					uuid: "desc",
				},
			});

			const requests = result.map((element) => ({
				uuid: element.uuid,
				sender: element.sender,
			}));

			return requests;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async getSentFriendRequests(uuid: string) {
		try {
			const result = await prisma.friendship.findMany({
				where: {
					status: "PENDING",
					OR: [{ senderId: uuid }],
				},
				include: {
					receiver: {
						select: userDtoSelect,
					},
				},
				orderBy: {
					uuid: "desc",
				},
			});

			const requests = result.map((element) => ({
				uuid: element.uuid,
				receiver: element.receiver,
			}));

			return requests;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async sendFriendRequest(uuid: string, receiverUuid: string) {
		try {
			if (uuid === receiverUuid) throw new SelfFriendRequestError();

			const existing = await prisma.friendship.findFirst({
				where: {
					OR: [
						{ senderId: uuid, receiverId: receiverUuid },
						{ senderId: receiverUuid, receiverId: uuid },
					],
				},
			});

			if (existing)
				throw existing.status === "ACCEPTED"
					? new FriendshipAlreadyExistError()
					: new PendingFriendRequestExistError();

			const result = await prisma.friendship.create({
				data: {
					senderId: uuid,
					receiverId: receiverUuid,
				},
				include: {
					receiver: {
						select: userDtoSelect,
					},
				},
			});

			return result;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") throw new UnknownUserIdError();
			}
			throw error;
		}
	}

	async acceptFriendRequest(uuid: string, requestUuid: string) {
		try {
			const result = await prisma.friendship.update({
				where: { uuid: requestUuid, receiverId: uuid },
				data: { status: "ACCEPTED" },
				include: {
					sender: {
						select: userDtoSelect,
					},
					receiver: {
						select: userDtoSelect,
					},
				},
			});

			const friendship = {
				uuid: result.uuid,
				user: result.sender,
			};

			return friendship;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") {
					const fields = getPrismaConstraintFields(error);
					if (fields.includes("uuid"))
						throw new UnknownFriendRequestError();
					if (fields.includes("receiverId"))
						throw new UnknownUserIdError();
					if (fields.length) throw new UnknownElementError(fields[0]);
					throw new UnknownFriendRequestError();
				}
			}
			throw error;
		}
	}

	async deleteFriendRequest(uuid: string, requestUuid: string) {
		try {
			const result = await prisma.friendship.delete({
				where: {
					uuid: requestUuid,
					OR: [{ receiverId: uuid }, { senderId: uuid }],
				},
			});

			return result;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2007") throw new InvalidIdError();
				if (error.code === "P2025") {
					const fields = getPrismaConstraintFields(error);
					if (fields.includes("uuid"))
						throw new UnknownFriendRequestError();
					if (fields.includes("receiverId"))
						throw new UnknownUserIdError();
					if (fields.includes("senderId"))
						throw new UnknownUserIdError();
					if (fields.length) throw new UnknownElementError(fields[0]);
					throw new UnknownFriendRequestError();
				}
			}
			throw error;
		}
	}

	async searchUser(query: string) {
		const result = await prisma.user.findMany({
			where: {
				username: {
					startsWith: query,
					mode: "insensitive",
				},
			},
		});

		return result;
	}
}

export const usersService = new UsersService();
