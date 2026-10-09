import {
	CreateLobbyDTO,
	UpdateLobbyDTO,
	MAX_CUSTOM_WORDS,
	MAX_PLAYERS,
} from "@ft_transcendence/shared";
import { v7 as uuidv7 } from "uuid";
import { LobbyEntity } from "./lobby.mapper";
import { DEFAULT_DICTIONARY } from "./dictionary";
import {
	LobbyFullError,
	LobbyNotFoundError,
	NotHostError,
	CannotBanHostError,
	UserNotInLobbyError,
	TooManyCustomWordsError,
	UnauthorizedLobbyAccessError,
	UserAlreadyInLobbyError,
	UserBannedFromLobbyError,
	InvalidElementError,
	NoWordsErrorInCustomWords,
} from "@/errors";

export const lobbiesByJoinCode = new Map<string, LobbyEntity>();

function generateJoinCode(): string {
	let joinCode: string;

	do {
		joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
	} while (lobbiesByJoinCode.has(joinCode));

	return joinCode;
}

function parseCustomWords(input: string): string[] {
	if (input.trim().length === 0) return [];
	let res = input.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
	res = Array.from(new Set(res));
	if (res.length > MAX_CUSTOM_WORDS) throw new TooManyCustomWordsError();
	return res;
}

//Fishers-Yates shuffle algorithm
function mixAllWords(allWords: Set<string>): string[] {
	const copy = Array.from(allWords);

	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}

	return copy;
}

function buildAllWords(
	usignDictionary: number,
	customWords: string[],
): string[] {
	const dictionaryWords = DEFAULT_DICTIONARY[usignDictionary];
	if (!dictionaryWords) throw new InvalidElementError("Dictionary not found");
	const allWordsSet = new Set<string>([...dictionaryWords, ...customWords]);
	return mixAllWords(allWordsSet);
}

function findLobbyOfUser(userId: string): LobbyEntity | undefined {
	return Array.from(lobbiesByJoinCode.values()).find((lobby) =>
		lobby.connectedPlayers.has(userId),
	);
}

export class LobbyService {
	async createLobby(
		hostId: string,
		data: CreateLobbyDTO,
	): Promise<LobbyEntity> {
		if (findLobbyOfUser(hostId)) throw new UserAlreadyInLobbyError();
		const code = generateJoinCode();
		const localCustomWords = parseCustomWords(data.customWords);
		const lobby: LobbyEntity = {
			uuid: uuidv7(),
			joinCode: code,
			hostId: hostId,
			mode: data.mode,
			visibility: data.visibility,
			connectedPlayers: new Set<string>().add(hostId),
			bannedPlayers: new Set<string>(),
			maxPlayers: MAX_PLAYERS,
			customWords: localCustomWords,
			usingDictionary: data.usingDictionary,
			drawTime: data.drawTime,
			numberOfRounds: data.numberOfRounds,
			wordChoicesPerTurn: data.wordChoicesPerTurn,
			timeToChooseWord: data.timeToChooseWord,
			allWords: buildAllWords(data.usingDictionary, localCustomWords),
		};
		lobbiesByJoinCode.set(code, lobby);
		return lobby;
	}

	async listLobbies(): Promise<LobbyEntity[]> {
		return Array.from(lobbiesByJoinCode.values()).filter(
			(lobby) =>
				lobby.visibility === "PUBLIC" &&
				lobby.connectedPlayers.size < lobby.maxPlayers,
		);
	}

	async getLobbyByJoinCode(joinCode: string): Promise<LobbyEntity | null> {
		const lobby = lobbiesByJoinCode.get(joinCode);
		return lobby || null;
	}

	async getLobbyByUuid(uuid: string): Promise<LobbyEntity | null> {
		const lobby = Array.from(lobbiesByJoinCode.values()).find(
			(lobby) => lobby.uuid === uuid,
		);
		return lobby || null;
	}

	async joinLobby(lobbyUuid: string, userId: string): Promise<void> {
		const lobby = await this.getLobbyByUuid(lobbyUuid);
		if (!lobby) throw new LobbyNotFoundError();
		if (findLobbyOfUser(userId)) throw new UserAlreadyInLobbyError();
		if (lobby.bannedPlayers.has(userId))
			throw new UserBannedFromLobbyError();
		if (lobby.connectedPlayers.size >= lobby.maxPlayers)
			throw new LobbyFullError();
		lobby.connectedPlayers.add(userId);
	}

	async leaveLobby(lobbyUuid: string, userId: string): Promise<void> {
		const lobby = await this.getLobbyByUuid(lobbyUuid);
		if (!lobby) throw new LobbyNotFoundError();
		if (!lobby.connectedPlayers.has(userId))
			throw new UnauthorizedLobbyAccessError();
		if (
			lobby.connectedPlayers.size === 1 &&
			lobby.connectedPlayers.has(userId)
		) {
			await this.deleteLobby(lobby.joinCode);
			return;
		}
		lobby.connectedPlayers.delete(userId);
		if (lobby.hostId === userId) {
			lobby.hostId = lobby.connectedPlayers.values().next().value!;
		}
	}

	async deleteLobby(joinCode: string): Promise<void> {
		lobbiesByJoinCode.delete(joinCode);
	}

	async updateLobby(
		lobbyUuid: string,
		data: UpdateLobbyDTO,
		userId: string,
	): Promise<LobbyEntity> {
		const lobby = await this.getLobbyByUuid(lobbyUuid);
		if (!lobby) throw new LobbyNotFoundError();
		if (lobby.hostId !== userId) throw new NotHostError();
		const { customWords, usingDictionary, ...otherSettings } = data;
		const newDictionary = usingDictionary ?? lobby.usingDictionary;
		const newWords = customWords
			? parseCustomWords(customWords)
			: lobby.customWords;
		if (newWords.length > MAX_CUSTOM_WORDS)
			throw new TooManyCustomWordsError();
		if (newDictionary === 0 && newWords.length === 0)
			throw new NoWordsErrorInCustomWords();

		const changedWords =
			newDictionary !== lobby.usingDictionary ||
			newWords.length !== lobby.customWords.length ||
			newWords.some((word, index) => word !== lobby.customWords[index]);
		const newAllWords = changedWords
			? buildAllWords(newDictionary, newWords)
			: lobby.allWords;

		Object.assign(lobby, {
			...otherSettings,
			customWords: newWords,
			usingDictionary: newDictionary,
			allWords: newAllWords,
		});
		Object.assign(lobby, data);
		return lobby;
	}

	async banLobby(
		lobbyUuid: string,
		userId: string,
		targetUserId: string,
	): Promise<void> {
		const lobby = await this.getLobbyByUuid(lobbyUuid);
		if (!lobby) throw new LobbyNotFoundError();
		if (lobby.hostId !== userId) throw new NotHostError();
		if (targetUserId === lobby.hostId) throw new CannotBanHostError();
		if (!lobby.connectedPlayers.has(targetUserId))
			throw new UserNotInLobbyError();
		lobby.connectedPlayers.delete(targetUserId);
		lobby.bannedPlayers.add(targetUserId);
	}

	async unbanLobby(
		lobbyUuid: string,
		userId: string,
		targetUserId: string,
	): Promise<void> {
		const lobby = await this.getLobbyByUuid(lobbyUuid);
		if (!lobby) throw new LobbyNotFoundError();
		if (lobby.hostId !== userId) throw new NotHostError();
		lobby.bannedPlayers.delete(targetUserId);
	}
}

export const lobbyService = new LobbyService();
