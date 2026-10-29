import {
	getMatch,
	beginTurn,
	dropLeftPlayers,
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
import { minPlayers } from "@ft_transcendence/shared";
import { registerPacketHandler, sendToWs } from "../../websocket.server";
import {
	CHOOSE_WORD_SECONDS,
	drawersPerTurn,
	lobbyService,
	pickDrawers,
} from "./lobby.service";
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
	const isDrawer = !!viewerId && lobby.drawerIds.includes(viewerId);
	const remaining = activePlayers(lobby).filter(
		(id) => !lobby.playedThisRound.has(id) && !lobby.drawerIds.includes(id),
	);
	return {
		type: "GAME_STATE",
		lobbyUuid: lobby.uuid,
		phase: lobby.gamePhase,
		round: lobby.round,
		totalRounds: lobby.numberOfRounds,
		turnNumber: lobby.turnNumber,
		totalTurns:
			lobby.turnNumber +
			Math.ceil(remaining.length / drawersPerTurn(lobby)),
		drawerIds: lobby.drawerIds,
		choices:
			isDrawer && lobby.gamePhase === "CHOOSING" ? lobby.wordChoices : [],
		selectedWord: isDrawer ? lobby.selectedWord : null,
		picks: isDrawer ? Object.fromEntries(lobby.picks) : {},
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

function connectedDrawers(lobby: LobbyEntity) {
	return lobby.drawerIds.filter((id) => lobby.connectedPlayers.has(id));
}

function nextTurn(lobby: LobbyEntity) {
	const players = activePlayers(lobby);
	const available = players.filter((id) => !lobby.playedThisRound.has(id));
	if (
		players.length < minPlayers(lobby.mode) ||
		(available.length === 0 && lobby.round >= lobby.numberOfRounds)
	) {
		finishMatch(lobby);
		return;
	}
	if (available.length === 0) {
		lobby.round++;
		lobby.playedThisRound.clear();
		lobby.turnNumber = 0;
	}
	const candidates = players.filter((id) => !lobby.playedThisRound.has(id));
	lobby.drawerIds = pickDrawers(lobby, candidates);
	lobby.turnNumber++;
	lobby.selectedWord = null;
	lobby.picks.clear();
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
	lobby.timerEndsAt = Date.now() + CHOOSE_WORD_SECONDS * 1000;
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
	dropLeftPlayers(lobby);
	for (const id of lobby.picks.keys())
		if (!lobby.connectedPlayers.has(id)) lobby.picks.delete(id);
	const drawers = connectedDrawers(lobby);
	const lonePick = drawers.length === 1 ? lobby.picks.get(drawers[0]) : null;
	if (activePlayers(lobby).length < 2) {
		settleTurn(lobby);
		finishMatch(lobby);
	} else if (lobby.gamePhase === "ROUND_END") return;
	else if (drawers.length === 0) finishTurn(lobby);
	// Partner left during DUO choosing: the remaining drawer's pick starts the turn.
	else if (lobby.gamePhase === "CHOOSING" && lonePick)
		startDrawing(lobby, lonePick);
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
				const picks = [...lobby.picks.values()];
				const word = picks.length
					? picks[Math.floor(Math.random() * picks.length)]
					: lobby.wordChoices[0];
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
				? CHOOSE_WORD_SECONDS
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
	if (connectedDrawers(lobby).length === 1) {
		startDrawing(lobby, packet.word);
		return;
	}
	lobby.picks.set(ws.uuid, packet.word);
	broadcastState(lobby);
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
