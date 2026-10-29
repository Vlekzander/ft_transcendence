import {
	getMatch,
	beginTurn,
	settleTurn,
	allGuessed,
	saveMatch,
} from "../game/scoring.service";
import type {
	AppWebSocket,
	ChooseWordPacket,
	DrawStrokePacket,
	DrawActionPacket,
	DrawHistoryPacket,
	GameStatePacket,
	JoinGamePacket,
	LobbyPingPacket,
} from "@ft_transcendence/shared";
import { registerPacketHandler, sendToWs } from "../../websocket.server";
import { lobbyService } from "./lobby.service";
import type { LobbyEntity } from "./lobby.mapper";
import { notifyLobbiesChanged, notifyLobbyUpdated } from "./lobby.events";

const roundTimers = new Map<string, NodeJS.Timeout>();
const PRESENCE_TIMEOUT_MS = 5000;
const presenceTimers = new Map<string, NodeJS.Timeout>();

function broadcast(
	lobby: LobbyEntity,
	packet: GameStatePacket | DrawStrokePacket | DrawActionPacket,
	senderId?: string,
) {
	for (const userId of lobby.connectedPlayers) {
		if (userId !== senderId) sendToWs(userId, packet);
	}
}

function statePacket(lobby: LobbyEntity, viewerId?: string): GameStatePacket {
	const players = Array.from(lobby.connectedPlayers).filter(
		(id) => !lobby.spectatorPlayers.has(id),
	);
	const isDrawer = !!viewerId && lobby.drawerIds.includes(viewerId);
	return {
		type: "GAME_STATE",
		lobbyUuid: lobby.uuid,
		phase: lobby.gamePhase,
		round: lobby.round,
		totalRounds: lobby.numberOfRounds,
		playerNumber:
			lobby.drawerIds.length > 0
				? Math.min(
						players.length,
						Math.max(
							1,
							players.filter((id) =>
								lobby.playedThisRound.has(id),
							).length +
								(lobby.drawerIds.every((id) =>
									lobby.playedThisRound.has(id),
								)
									? 0
									: 1),
						),
					)
				: 0,
		totalPlayers: players.length,
		drawerIds: lobby.drawerIds,
		choices:
			isDrawer && lobby.gamePhase === "CHOOSING" ? lobby.wordChoices : [],
		selectedWord: isDrawer ? lobby.selectedWord : null,
		timerEndsAt: lobby.timerEndsAt,
		matchId: getMatch(lobby)?.id ?? null,
		scores: Object.fromEntries(getMatch(lobby)?.scores ?? []),
		guessedPlayers: [...(getMatch(lobby)?.turn?.guesses.keys() ?? [])],
		lastTurn: getMatch(lobby)?.lastTurn ?? null,
		persistence: getMatch(lobby)?.persistence ?? "NONE",
	};
}

async function persistResults(lobby: LobbyEntity) {
	try {
		const saving = saveMatch(lobby);
		broadcastState(lobby);
		await saving;
	} catch (error) {
		console.error("Unable to persist game results", error);
	}
	broadcastState(lobby);
}

function finishMatch(lobby: LobbyEntity) {
	stopRoundTimer(lobby.uuid);
	const match = getMatch(lobby);
	if (!match || match.endedAt) return;
	match.endedAt = Date.now();
	lobby.gameStarted = false;
	lobby.gameHasStarted = false;
	lobby.gamePhase = "FINISHED";
	lobby.timerEndsAt = null;
	lobby.timeRemainingMs = 0;
	lobby.selectedWord = null;
	lobby.wordChoices = [];
	lobby.readyPlayers.clear();
	lobby.spectatorPlayers.clear();
	broadcastState(lobby);
	notifyLobbyUpdated(lobby);
	void persistResults(lobby);
}

function activePlayers(lobby: LobbyEntity) {
	const match = getMatch(lobby);
	return [...lobby.connectedPlayers].filter(
		(id) =>
			match?.scores.has(id) &&
			!lobby.spectatorPlayers.has(id) &&
			!lobby.bannedPlayers.has(id),
	);
}

function nextTurn(lobby: LobbyEntity) {
	const players = activePlayers(lobby);
	const available = players.filter((id) => !lobby.playedThisRound.has(id));
	if (
		players.length < 2 ||
		(available.length === 0 && lobby.round >= lobby.numberOfRounds)
	) {
		finishMatch(lobby);
		return;
	}
	if (available.length === 0) {
		lobby.round++;
		lobby.playedThisRound.clear();
	}
	const candidates = players.filter((id) => !lobby.playedThisRound.has(id));
	lobby.drawerIds = [
		candidates[Math.floor(Math.random() * candidates.length)],
	];
	lobby.selectedWord = null;
	lobby.wordChoices = [...lobby.allWords]
		.sort(() => Math.random() - 0.5)
		.slice(0, lobby.wordChoicesPerTurn);
	const match = getMatch(lobby);
	if (match) {
		match.turn = undefined;
		match.lastTurn = null;
	}
	lobby.gameStarted = true;
	lobby.gamePhase = "CHOOSING";
	lobby.drawHistory = [];
	lobby.timerEndsAt = Date.now() + lobby.timeToChooseWord * 1000;
	lobby.timeRemainingMs = 0;
	broadcast(lobby, {
		type: "DRAW_ACTION",
		lobbyUuid: lobby.uuid,
		action: { kind: "CLEAR" },
	});
	scheduleRoundEnd(lobby);
	broadcastState(lobby);
	notifyLobbyUpdated(lobby);
}

export function finishTurn(lobby: LobbyEntity) {
	if (
		lobby.gamePhase !== "DRAWING" &&
		lobby.gamePhase !== "PAUSED" &&
		lobby.gamePhase !== "CHOOSING"
	)
		return;
	stopRoundTimer(lobby.uuid);
	settleTurn(lobby);
	for (const id of lobby.drawerIds) lobby.playedThisRound.add(id);
	lobby.gamePhase = "ROUND_END";
	lobby.gameStarted = true;
	lobby.timerEndsAt = Date.now() + 4000;
	lobby.timeRemainingMs = 0;
	scheduleRoundEnd(lobby);
	broadcastState(lobby);
	notifyLobbyUpdated(lobby);
}

export function completeRoundIfSolved(lobby: LobbyEntity) {
	if (lobby.gamePhase === "DRAWING" && allGuessed(lobby)) finishTurn(lobby);
	else broadcastState(lobby);
}

export function reconcileGame(lobby: LobbyEntity) {
	if (!lobby.gameHasStarted) return;
	if (activePlayers(lobby).length < 2) {
		settleTurn(lobby);
		finishMatch(lobby);
	} else if (lobby.gamePhase === "ROUND_END") return;
	else if (!lobby.drawerIds.some((id) => lobby.connectedPlayers.has(id)))
		finishTurn(lobby);
	else completeRoundIfSolved(lobby);
}

function startDrawing(lobby: LobbyEntity, word: string) {
	lobby.selectedWord = word;
	lobby.gamePhase = "DRAWING";
	lobby.drawHistory = [];
	lobby.timerEndsAt = Date.now() + lobby.drawTime * 1000;
	lobby.timeRemainingMs = 0;
	beginTurn(lobby);
	scheduleRoundEnd(lobby);
	broadcastState(lobby);
}

export function scheduleRoundEnd(lobby: LobbyEntity) {
	stopRoundTimer(lobby.uuid);
	if (!lobby.timerEndsAt || !lobby.gameStarted) return;
	const timer = setTimeout(
		() => {
			roundTimers.delete(lobby.uuid);
			if (!lobby.gameStarted) return;
			if (lobby.gamePhase === "CHOOSING") {
				const word = lobby.wordChoices[0];
				if (word) startDrawing(lobby, word);
				else finishTurn(lobby);
			} else if (lobby.gamePhase === "DRAWING") finishTurn(lobby);
			else if (lobby.gamePhase === "ROUND_END") nextTurn(lobby);
		},
		Math.max(0, lobby.timerEndsAt - Date.now()),
	);
	roundTimers.set(lobby.uuid, timer);
}

export function stopRoundTimer(lobbyUuid: string) {
	const timer = roundTimers.get(lobbyUuid);
	if (timer) clearTimeout(timer);
	roundTimers.delete(lobbyUuid);
}

async function handleJoinGame(ws: AppWebSocket, packet: JoinGamePacket) {
	if (!ws.uuid) return;
	const lobby = await lobbyService.getLobbyByUuid(packet.lobbyUuid);
	if (!lobby || !lobby.connectedPlayers.has(ws.uuid)) return;
	if (
		(lobby.gamePhase === "CHOOSING" || lobby.gamePhase === "DRAWING") &&
		!lobby.timerEndsAt
	) {
		lobby.timerEndsAt =
			Date.now() +
			(lobby.gamePhase === "CHOOSING"
				? lobby.timeToChooseWord
				: lobby.drawTime) *
				1000;
		scheduleRoundEnd(lobby);
	}
	ws.send(JSON.stringify(statePacket(lobby, ws.uuid)));
	const historyPacket: DrawHistoryPacket = {
		type: "DRAW_HISTORY",
		lobbyUuid: lobby.uuid,
		packets:
			lobby.gamePhase === "WAITING" ||
			lobby.gamePhase === "ROUND_END" ||
			lobby.gamePhase === "FINISHED"
				? []
				: lobby.drawHistory,
	};
	ws.send(JSON.stringify(historyPacket));
	if (
		lobby.gameStarted &&
		(lobby.gamePhase === "CHOOSING" || lobby.gamePhase === "DRAWING")
	) {
		scheduleRoundEnd(lobby);
	}
}

async function handleChooseWord(ws: AppWebSocket, packet: ChooseWordPacket) {
	if (!ws.uuid) return;
	const lobby = await lobbyService.getLobbyByUuid(packet.lobbyUuid);
	if (
		!lobby ||
		!lobby.connectedPlayers.has(ws.uuid) ||
		!lobby.gameStarted ||
		!lobby.timerEndsAt ||
		Date.now() >= lobby.timerEndsAt ||
		!lobby.drawerIds.includes(ws.uuid) ||
		lobby.gamePhase !== "CHOOSING" ||
		!lobby.wordChoices.includes(packet.word)
	)
		return;
	startDrawing(lobby, packet.word);
}

export function broadcastState(lobby: LobbyEntity) {
	for (const userId of lobby.connectedPlayers)
		sendToWs(userId, statePacket(lobby, userId));
}

async function handleDrawStroke(ws: AppWebSocket, packet: DrawStrokePacket) {
	if (!ws.uuid) return;
	const lobby = await lobbyService.getLobbyByUuid(packet.lobbyUuid);
	if (
		!lobby ||
		!lobby.connectedPlayers.has(ws.uuid) ||
		!lobby.gameStarted ||
		!lobby.timerEndsAt ||
		Date.now() >= lobby.timerEndsAt ||
		!lobby.drawerIds.includes(ws.uuid) ||
		lobby.gamePhase !== "DRAWING"
	)
		return;
	lobby.drawHistory.push(packet);
	broadcast(lobby, packet, ws.uuid);
}

async function handleDrawAction(ws: AppWebSocket, packet: DrawActionPacket) {
	if (!ws.uuid) return;
	const lobby = await lobbyService.getLobbyByUuid(packet.lobbyUuid);
	if (
		!lobby ||
		!lobby.connectedPlayers.has(ws.uuid) ||
		!lobby.gameStarted ||
		!lobby.timerEndsAt ||
		Date.now() >= lobby.timerEndsAt ||
		!lobby.drawerIds.includes(ws.uuid) ||
		lobby.gamePhase !== "DRAWING"
	)
		return;
	if (packet.action.kind === "CLEAR") lobby.drawHistory = [];
	else lobby.drawHistory.push(packet);
	broadcast(lobby, packet, ws.uuid);
}

export async function removePlayerFromLobby(
	lobbyUuid: string,
	userId: string,
): Promise<void> {
	const lobby = await lobbyService.getLobbyByUuid(lobbyUuid);
	await lobbyService.leaveLobby(lobbyUuid, userId);
	if (lobby) reconcileGame(lobby);
	if (lobby && lobby.connectedPlayers.size > 0) {
		notifyLobbyUpdated(lobby);
	} else {
		stopRoundTimer(lobbyUuid);
		notifyLobbiesChanged();
	}
}

async function removeIfStillMember(lobbyUuid: string, userId: string) {
	const lobby = await lobbyService.getLobbyByUuid(lobbyUuid);
	if (!lobby || !lobby.connectedPlayers.has(userId)) return;
	await removePlayerFromLobby(lobbyUuid, userId);
}

export function resetPresenceTimer(lobbyUuid: string, userId: string) {
	clearTimeout(presenceTimers.get(userId));
	const timer = setTimeout(() => {
		presenceTimers.delete(userId);
		removeIfStillMember(lobbyUuid, userId).catch((error) =>
			console.error("Unable to remove inactive player", error),
		);
	}, PRESENCE_TIMEOUT_MS);
	presenceTimers.set(userId, timer);
}

async function handleLobbyPing(ws: AppWebSocket, packet: LobbyPingPacket) {
	if (!ws.uuid) return;
	const lobby = await lobbyService.getLobbyByUuid(packet.lobbyUuid);
	if (!lobby || !lobby.connectedPlayers.has(ws.uuid)) return;
	resetPresenceTimer(lobby.uuid, ws.uuid);
}

export function registerGameSockets(): void {
	registerPacketHandler("JOIN_GAME", handleJoinGame);
	registerPacketHandler("LOBBY_PING", handleLobbyPing);
	registerPacketHandler("RETRY_GAME_SAVE", async (ws, packet) => {
		const lobby = await lobbyService.getLobbyByUuid(packet.lobbyUuid);
		if (
			!lobby ||
			ws.uuid !== lobby.hostId ||
			lobby.gamePhase !== "FINISHED"
		)
			return;
		await persistResults(lobby);
	});
	registerPacketHandler("CHOOSE_WORD", handleChooseWord);
	registerPacketHandler("DRAW_STROKE", handleDrawStroke);
	registerPacketHandler("DRAW_ACTION", handleDrawAction);
}

export { statePacket };
