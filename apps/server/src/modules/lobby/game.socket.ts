import type {
	AppWebSocket,
	ChooseWordPacket,
	DrawStrokePacket,
	DrawActionPacket,
	GameStatePacket,
	JoinGamePacket,
} from "@ft_transcendence/shared";
import { registerPacketHandler, sendToWs } from "../../websocket.server";
import { lobbyService } from "./lobby.service";
import type { LobbyEntity } from "./lobby.mapper";

const roundTimers = new Map<string, NodeJS.Timeout>();

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
	return {
		type: "GAME_STATE",
		lobbyUuid: lobby.uuid,
		phase: lobby.gamePhase,
		round: lobby.round,
		totalRounds: lobby.numberOfRounds,
		playerNumber: lobby.drawerId
			? Math.max(1, lobby.playedThisRound.size + 1)
			: 0,
		totalPlayers: players.length,
		drawerId: lobby.drawerId,
		choices:
			viewerId === lobby.drawerId && lobby.gamePhase === "CHOOSING"
				? lobby.wordChoices
				: [],
		selectedWord: viewerId === lobby.drawerId ? lobby.selectedWord : null,
		timerEndsAt: lobby.timerEndsAt,
	};
}

function scheduleRoundEnd(lobby: LobbyEntity) {
	const oldTimer = roundTimers.get(lobby.uuid);
	if (oldTimer) clearTimeout(oldTimer);
	if (!lobby.timerEndsAt) return;

	const timer = setTimeout(
		() => {
			if (!lobby.gameStarted) return;
			if (lobby.gamePhase === "CHOOSING") {
				const word = lobby.wordChoices[0];
				if (!word) return;
				lobby.selectedWord = word;
				lobby.gamePhase = "DRAWING";
				lobby.timerEndsAt = Date.now() + lobby.drawTime * 1000;
				scheduleRoundEnd(lobby);
				broadcastState(lobby);
				return;
			}

			lobby.playedThisRound.add(lobby.drawerId ?? "");
			const players = Array.from(lobby.connectedPlayers).filter(
				(id) => !lobby.spectatorPlayers.has(id),
			);
			if (
				lobby.round >= lobby.numberOfRounds &&
				lobby.playedThisRound.size >= players.length
			) {
				lobby.gameStarted = false;
				lobby.gameHasStarted = false;
				lobby.gamePhase = "WAITING";
				lobby.round = 0;
				lobby.drawerId = null;
				lobby.wordChoices = [];
				lobby.selectedWord = null;
				lobby.timerEndsAt = null;
				lobby.timeRemainingMs = 0;
				lobby.playedThisRound.clear();
				lobby.readyPlayers.clear();
				lobby.spectatorPlayers.clear();
				roundTimers.delete(lobby.uuid);
				broadcastState(lobby);
				return;
			}

			if (lobby.playedThisRound.size >= players.length) {
				lobby.round += 1;
				lobby.playedThisRound.clear();
			}
			lobby.selectedWord = null;
			lobby.timerEndsAt = Date.now() + lobby.timeToChooseWord * 1000;
			const available = players.filter(
				(id) => !lobby.playedThisRound.has(id),
			);
			lobby.drawerId =
				available[Math.floor(Math.random() * available.length)] ?? null;
			lobby.wordChoices = [...lobby.allWords]
				.sort(() => Math.random() - 0.5)
				.slice(0, lobby.wordChoicesPerTurn);
			lobby.gamePhase = "CHOOSING";
			scheduleRoundEnd(lobby);
			broadcastState(lobby);
		},
		Math.max(0, lobby.timerEndsAt - Date.now()),
	);
	roundTimers.set(lobby.uuid, timer);
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
		lobby.drawerId !== ws.uuid ||
		lobby.gamePhase !== "CHOOSING" ||
		!lobby.wordChoices.includes(packet.word)
	)
		return;
	lobby.selectedWord = packet.word;
	lobby.gamePhase = "DRAWING";
	lobby.timerEndsAt = Date.now() + lobby.drawTime * 1000;
	lobby.timeRemainingMs = 0;
	scheduleRoundEnd(lobby);
	broadcastState(lobby);
}

function broadcastState(lobby: LobbyEntity) {
	for (const userId of lobby.connectedPlayers)
		sendToWs(userId, statePacket(lobby, userId));
}

async function handleDrawStroke(ws: AppWebSocket, packet: DrawStrokePacket) {
	if (!ws.uuid) return;
	const lobby = await lobbyService.getLobbyByUuid(packet.lobbyUuid);
	if (!lobby || lobby.drawerId !== ws.uuid || lobby.gamePhase !== "DRAWING")
		return;
	broadcast(lobby, packet, ws.uuid);
}

async function handleDrawAction(ws: AppWebSocket, packet: DrawActionPacket) {
	if (!ws.uuid) return;
	const lobby = await lobbyService.getLobbyByUuid(packet.lobbyUuid);
	if (!lobby || lobby.drawerId !== ws.uuid || lobby.gamePhase !== "DRAWING")
		return;
	broadcast(lobby, packet, ws.uuid);
}

export function registerGameSockets(): void {
	registerPacketHandler("JOIN_GAME", handleJoinGame);
	registerPacketHandler("CHOOSE_WORD", handleChooseWord);
	registerPacketHandler("DRAW_STROKE", handleDrawStroke);
	registerPacketHandler("DRAW_ACTION", handleDrawAction);
}

export { statePacket };
