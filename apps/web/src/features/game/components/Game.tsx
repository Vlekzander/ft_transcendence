"use client";

import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type PointerEvent,
} from "react";
import { useParams } from "react-router";
import type {
	ChooseWordPacket,
	DrawActionPacket,
	DrawHistoryPacket,
	DrawStrokePacket,
	GamePhase,
	GameStatePacket,
	JoinGamePacket,
	LobbyPingPacket,
} from "@ft_transcendence/shared";
import { useAuth } from "../../auth/context/AuthContext";
import { useWebSocket } from "../../websocket/context/WebSocketContext";
import { useWsEvent } from "../../websocket/hooks/useWsEvent";

type GameProps = {
	gameStarted: boolean;
};

const CANVAS_BG = "#ffffff";

function fillBackground(ctx: CanvasRenderingContext2D) {
	ctx.globalCompositeOperation = "source-over";
	ctx.fillStyle = CANVAS_BG;
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawDot(
	ctx: CanvasRenderingContext2D,
	point: { x: number; y: number },
	size: number,
	color: string,
) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
	ctx.fill();
}

function floodFill(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	fillColorValue: string,
) {
	const pixelX = Math.max(0, Math.min(Math.floor(x), canvas.width - 1));
	const pixelY = Math.max(0, Math.min(Math.floor(y), canvas.height - 1));
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const pixels = imageData.data;
	const startIndex = (pixelY * canvas.width + pixelX) * 4;
	const targetColor = pixels.slice(startIndex, startIndex + 4);
	const fillColor = fillColorValue
		.slice(1)
		.match(/.{2}/g)
		?.map((channel) => Number.parseInt(channel, 16));

	if (!fillColor || fillColor.length !== 3) return;

	const replacementColor = new Uint8ClampedArray([...fillColor, 255]);
	if (
		targetColor[0] === replacementColor[0] &&
		targetColor[1] === replacementColor[1] &&
		targetColor[2] === replacementColor[2] &&
		targetColor[3] === replacementColor[3]
	) {
		return;
	}

	const stack: [number, number][] = [[pixelX, pixelY]];
	while (stack.length > 0) {
		const [currentX, currentY] = stack.pop()!;
		const index = (currentY * canvas.width + currentX) * 4;

		if (
			pixels[index] !== targetColor[0] ||
			pixels[index + 1] !== targetColor[1] ||
			pixels[index + 2] !== targetColor[2] ||
			pixels[index + 3] !== targetColor[3]
		) {
			continue;
		}

		pixels.set(replacementColor, index);
		if (currentX > 0) stack.push([currentX - 1, currentY]);
		if (currentX < canvas.width - 1) stack.push([currentX + 1, currentY]);
		if (currentY > 0) stack.push([currentX, currentY - 1]);
		if (currentY < canvas.height - 1) stack.push([currentX, currentY + 1]);
	}

	ctx.putImageData(imageData, 0, 0);
}

export default function Game({ gameStarted: lobbyGameStarted }: GameProps) {
	const { uuid } = useParams<{ uuid: string }>();
	const { user } = useAuth();
	const { sendPacket, isConnected } = useWebSocket();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
	const lastPointRef = useRef<{ x: number; y: number } | null>(null);
	const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
	const shapeSnapshotRef = useRef<ImageData | null>(null);
	const brushCursorRef = useRef<HTMLDivElement | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [color, setColor] = useState("#000000");
	const [recentColors, setRecentColors] = useState<string[]>([
		"#000000",
		"#ffffff",
	]);
	const [size, setSize] = useState(5);
	const [isPickingColor, setIsPickingColor] = useState(false);
	const [isErasing, setIsErasing] = useState(false);
	const [isFilling, setIsFilling] = useState(false);
	const [shapeMode, setShapeMode] = useState<
		"freehand" | "rectangle" | "circle"
	>("freehand");
	const [gameStarted, setGameStarted] = useState(lobbyGameStarted);
	const [prevLobbyGameStarted, setPrevLobbyGameStarted] =
		useState(lobbyGameStarted);
	if (prevLobbyGameStarted !== lobbyGameStarted) {
		setPrevLobbyGameStarted(lobbyGameStarted);
		setGameStarted(lobbyGameStarted);
	}
	const [phase, setPhase] = useState<GamePhase>("WAITING");
	const [drawerIds, setDrawerIds] = useState<string[]>([]);
	const [choices, setChoices] = useState<string[]>([]);
	const [selectedWord, setSelectedWord] = useState<string | null>(null);
	const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
	const [clock, setClock] = useState(() => Date.now());
	const [playerNumber, setPlayerNumber] = useState(0);
	const [totalPlayers, setTotalPlayers] = useState(0);
	const [round, setRound] = useState(0);
	const [totalRounds, setTotalRounds] = useState(0);
	const previousDrawingRef = useRef<string | null>(null);
	const isDrawer = !!user && drawerIds.includes(user.uuid);
	const canDraw = gameStarted && phase === "DRAWING" && isDrawer;

	const getCtx = useCallback(() => {
		if (!ctxRef.current && canvasRef.current)
			ctxRef.current = canvasRef.current.getContext("2d", {
				willReadFrequently: true,
			});
		return ctxRef.current;
	}, []);

	const handleGameState = useCallback(
		(packet: GameStatePacket) => {
			if (packet.lobbyUuid !== uuid) return;
			setPhase(packet.phase);
			setGameStarted(
				packet.phase === "CHOOSING" || packet.phase === "DRAWING",
			);
			setRound(packet.round);
			setTotalRounds(packet.totalRounds);
			setDrawerIds(packet.drawerIds);
			setPlayerNumber(packet.playerNumber);
			setTotalPlayers(packet.totalPlayers);
			setChoices(packet.choices);
			setSelectedWord(packet.selectedWord);
			setTimerEndsAt(packet.timerEndsAt);
			const drawingKey = `${packet.matchId}:${packet.round}:${packet.drawerIds.join(",")}`;
			if (
				(packet.phase === "CHOOSING" || packet.phase === "DRAWING") &&
				previousDrawingRef.current !== drawingKey
			) {
				const ctx = getCtx();
				if (ctx) fillBackground(ctx);
				previousDrawingRef.current = drawingKey;
			}
		},
		[uuid],
	);
	useWsEvent("GAME_STATE", handleGameState);

	const handleRemoteStroke = useCallback(
		(packet: DrawStrokePacket) => {
			if (packet.lobbyUuid !== uuid) return;
			const ctx = getCtx();
			if (!ctx) return;
			const strokeColor = packet.eraser ? CANVAS_BG : packet.color;
			ctx.strokeStyle = strokeColor;
			ctx.lineWidth = packet.size;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.globalCompositeOperation = "source-over";
			if (
				packet.from.x === packet.to.x &&
				packet.from.y === packet.to.y
			) {
				drawDot(ctx, packet.from, packet.size, strokeColor);
				return;
			}
			ctx.beginPath();
			ctx.moveTo(packet.from.x, packet.from.y);
			ctx.lineTo(packet.to.x, packet.to.y);
			ctx.stroke();
		},
		[uuid],
	);
	useWsEvent("DRAW_STROKE", handleRemoteStroke);

	const handleRemoteAction = useCallback(
		(packet: DrawActionPacket) => {
			if (packet.lobbyUuid !== uuid) return;
			const canvas = canvasRef.current;
			const ctx = getCtx();
			if (!canvas || !ctx) return;
			const action = packet.action;
			if (action.kind === "CLEAR") {
				fillBackground(ctx);
				return;
			}
			if (action.kind === "FILL") {
				floodFill(canvas, ctx, action.x, action.y, action.color);
				return;
			}
			ctx.strokeStyle = action.eraser ? CANVAS_BG : action.color;
			ctx.lineWidth = action.size;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.globalCompositeOperation = "source-over";
			drawShape(ctx, action.mode, action.from, action.to);
		},
		[uuid],
	);
	useWsEvent("DRAW_ACTION", handleRemoteAction);

	const handleDrawHistory = useCallback(
		(packet: DrawHistoryPacket) => {
			if (packet.lobbyUuid !== uuid) return;
			const ctx = getCtx();
			if (!ctx) return;
			fillBackground(ctx);
			for (const drawPacket of packet.packets) {
				if (drawPacket.type === "DRAW_STROKE")
					handleRemoteStroke(drawPacket);
				else handleRemoteAction(drawPacket);
			}
		},
		[uuid, handleRemoteStroke, handleRemoteAction],
	);
	useWsEvent("DRAW_HISTORY", handleDrawHistory);

	useEffect(() => {
		if (!uuid || !isConnected) return;
		const packet: JoinGamePacket = { type: "JOIN_GAME", lobbyUuid: uuid };
		sendPacket(packet);
	}, [sendPacket, uuid, isConnected]);

	useEffect(() => {
		if (!uuid || !isConnected) return;
		const packet: LobbyPingPacket = { type: "LOBBY_PING", lobbyUuid: uuid };
		const interval = setInterval(() => sendPacket(packet), 1000);
		return () => clearInterval(interval);
	}, [sendPacket, uuid, isConnected]);

	useEffect(() => {
		if (!timerEndsAt) return;
		const interval = setInterval(() => setClock(Date.now()), 250);
		return () => clearInterval(interval);
	}, [timerEndsAt]);
	const secondsLeft = timerEndsAt
		? Math.max(0, Math.ceil((timerEndsAt - clock) / 1000))
		: 0;
	const toolButtonClass =
		"rounded-sm border-2 px-3 py-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
	const inactiveToolButtonClass = `${toolButtonClass} border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50`;
	const activeToolButtonClass = `${toolButtonClass} border-blue-600 bg-blue-100 text-blue-800`;
	const predefinedColors = [
		"#000000",
		"#ffffff",
		"#ef4444",
		"#f97316",
		"#eab308",
		"#22c55e",
		"#06b6d4",
		"#3b82f6",
		"#8b5cf6",
		"#ec4899",
	];

	const selectColor = (nextColor: string) => {
		setColor(nextColor);
		setIsErasing(false);
		commitRecentColor(nextColor);
	};

	const commitRecentColor = (nextColor: string) => {
		setRecentColors((previousColors) =>
			[
				nextColor,
				...previousColors.filter(
					(recentColor) => recentColor !== nextColor,
				),
			].slice(0, 2),
		);
	};

	const getMousePosition = (e: PointerEvent<HTMLCanvasElement>) => {
		const canvas = e.currentTarget;
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left - canvas.clientLeft;
		const y = e.clientY - rect.top - canvas.clientTop;

		return {
			x: (x * canvas.width) / canvas.clientWidth,
			y: (y * canvas.height) / canvas.clientHeight,
		};
	};

	function drawShape(
		ctx: CanvasRenderingContext2D,
		mode: "rectangle" | "circle",
		start: { x: number; y: number },
		end: { x: number; y: number },
	) {
		ctx.beginPath();
		if (mode === "rectangle") {
			ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
		} else {
			const radiusX = Math.abs(end.x - start.x) / 2;
			const radiusY = Math.abs(end.y - start.y) / 2;
			ctx.ellipse(
				(start.x + end.x) / 2,
				(start.y + end.y) / 2,
				radiusX,
				radiusY,
				0,
				0,
				Math.PI * 2,
			);
		}
		ctx.stroke();
	}

	const startDrawing = (e: PointerEvent<HTMLCanvasElement>) => {
		if (!gameStarted || phase !== "DRAWING" || !isDrawer || e.button !== 0)
			return;

		window.getSelection()?.removeAllRanges();

		const ctx = getCtx();
		if (!ctx) return;

		if (isPickingColor) {
			const { x, y } = getMousePosition(e);
			const pixel = ctx.getImageData(
				Math.min(Math.floor(x), e.currentTarget.width - 1),
				Math.min(Math.floor(y), e.currentTarget.height - 1),
				1,
				1,
			).data;
			const hexColor = `#${[pixel[0], pixel[1], pixel[2]]
				.map((channel) => channel.toString(16).padStart(2, "0"))
				.join("")}`;

			selectColor(hexColor);
			setIsPickingColor(false);
			return;
		}

		if (isFilling) {
			const { x, y } = getMousePosition(e);
			floodFill(e.currentTarget, ctx, x, y, color);
			sendPacket({
				type: "DRAW_ACTION",
				lobbyUuid: uuid ?? "",
				action: { kind: "FILL", x, y, color },
			});
			return;
		}

		e.currentTarget.setPointerCapture(e.pointerId);

		const { x, y } = getMousePosition(e);

		const strokeColor = isErasing ? CANVAS_BG : color;
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = size;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.imageSmoothingEnabled = true;
		ctx.globalCompositeOperation = "source-over";

		if (shapeMode !== "freehand") {
			e.currentTarget.setPointerCapture(e.pointerId);
			shapeStartRef.current = { x, y };
			shapeSnapshotRef.current = ctx.getImageData(
				0,
				0,
				e.currentTarget.width,
				e.currentTarget.height,
			);
			setIsDrawing(true);
			return;
		}

		setIsDrawing(true);

		drawDot(ctx, { x, y }, size, strokeColor);
		ctx.beginPath();
		ctx.moveTo(x, y);
		sendPacket({
			type: "DRAW_STROKE",
			lobbyUuid: uuid ?? "",
			from: { x, y },
			to: { x, y },
			color,
			size,
			eraser: isErasing,
		});
		lastPointRef.current = { x, y };
	};

	const showBrushCursor =
		canDraw && shapeMode === "freehand" && !isFilling && !isPickingColor;

	// Moved through the ref, not state, to avoid re-rendering on every move
	const moveBrushCursor = (e: PointerEvent<HTMLCanvasElement>) => {
		const brushCursor = brushCursorRef.current;
		if (!brushCursor) return;

		const canvas = e.currentTarget;
		const rect = canvas.getBoundingClientRect();
		const diameter = size * (canvas.clientWidth / canvas.width);

		brushCursor.style.width = `${diameter}px`;
		brushCursor.style.height = `${diameter}px`;
		brushCursor.style.left = `${e.clientX - rect.left}px`;
		brushCursor.style.top = `${e.clientY - rect.top}px`;
		brushCursor.style.visibility = "visible";
	};

	const hideBrushCursor = () => {
		if (brushCursorRef.current)
			brushCursorRef.current.style.visibility = "hidden";
	};

	const draw = (e: PointerEvent<HTMLCanvasElement>) => {
		if (!gameStarted || phase !== "DRAWING" || !isDrawer || !isDrawing)
			return;

		const ctx = getCtx();
		if (!ctx) return;

		const { x, y } = getMousePosition(e);
		if (shapeMode !== "freehand") {
			const shapeStart = shapeStartRef.current;
			const shapeSnapshot = shapeSnapshotRef.current;
			if (!shapeStart || !shapeSnapshot) return;

			ctx.putImageData(shapeSnapshot, 0, 0);
			drawShape(ctx, shapeMode, shapeStart, { x, y });
			return;
		}

		const lastPoint = lastPointRef.current;
		if (!lastPoint) return;

		const distance = Math.hypot(x - lastPoint.x, y - lastPoint.y);
		const steps = Math.max(1, Math.ceil(distance / Math.max(1, size / 2)));
		ctx.beginPath();
		ctx.moveTo(lastPoint.x, lastPoint.y);
		for (let step = 1; step <= steps; step += 1) {
			const progress = step / steps;
			ctx.lineTo(
				lastPoint.x + (x - lastPoint.x) * progress,
				lastPoint.y + (y - lastPoint.y) * progress,
			);
		}
		ctx.stroke();
		if (lastPoint) {
			sendPacket({
				type: "DRAW_STROKE",
				lobbyUuid: uuid ?? "",
				from: lastPoint,
				to: { x, y },
				color,
				size,
				eraser: isErasing,
			});
		}
		lastPointRef.current = { x, y };
	};

	const stopDrawing = (e: PointerEvent<HTMLCanvasElement>) => {
		if (isDrawing && shapeMode !== "freehand") {
			const ctx = getCtx();
			const shapeStart = shapeStartRef.current;
			const shapeSnapshot = shapeSnapshotRef.current;
			if (ctx && shapeStart && shapeSnapshot) {
				const { x, y } = getMousePosition(e);
				ctx.putImageData(shapeSnapshot, 0, 0);
				drawShape(ctx, shapeMode, shapeStart, { x, y });
				sendPacket({
					type: "DRAW_ACTION",
					lobbyUuid: uuid ?? "",
					action: {
						kind: "SHAPE",
						mode: shapeMode,
						from: shapeStart,
						to: { x, y },
						color,
						size,
						eraser: isErasing,
					},
				});
			}
		}
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
		setIsDrawing(false);
		lastPointRef.current = null;
		shapeStartRef.current = null;
		shapeSnapshotRef.current = null;
	};

	const clearDrawing = () => {
		if (!canDraw) return;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = getCtx();
		if (!ctx) return;

		fillBackground(ctx);
		sendPacket({
			type: "DRAW_ACTION",
			lobbyUuid: uuid ?? "",
			action: { kind: "CLEAR" },
		});
	};

	return (
		<div>
			<div className="mb-3 flex items-center justify-between font-semibold">
				<span>
					Round {round}/{totalRounds} · Drawing turn {playerNumber}/
					{totalPlayers}
				</span>
				{(phase === "CHOOSING" || phase === "DRAWING") && (
					<span>{secondsLeft}s</span>
				)}
			</div>
			{isDrawer && phase === "CHOOSING" && choices.length > 0 && (
				<div className="mb-3 flex flex-wrap justify-center gap-2">
					{choices.map((word) => {
						const packet: ChooseWordPacket = {
							type: "CHOOSE_WORD",
							lobbyUuid: uuid ?? "",
							word,
						};
						return (
							<button
								key={word}
								type="button"
								onClick={() => sendPacket(packet)}
								className="border border-primary px-3 py-2 text-primary hover:bg-primary/10"
							>
								{word}
							</button>
						);
					})}
				</div>
			)}
			{isDrawer && selectedWord && (
				<p className="mb-3 text-center font-semibold">
					Draw: {selectedWord}
				</p>
			)}
			<div className="relative w-full overflow-hidden">
				<canvas
					ref={canvasRef}
					width={1280}
					height={720}
					className={`block h-auto w-full touch-none select-none border-4 border-gray-800 ${showBrushCursor ? "cursor-none" : ""}`}
					onPointerDown={startDrawing}
					onPointerMove={(e) => {
						moveBrushCursor(e);
						draw(e);
					}}
					onPointerUp={stopDrawing}
					onPointerCancel={stopDrawing}
					onPointerLeave={hideBrushCursor}
				/>
				{showBrushCursor && (
					<div
						ref={brushCursorRef}
						className="pointer-events-none invisible absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-black"
						style={{
							backgroundColor: isErasing ? "transparent" : color,
						}}
					/>
				)}
				{!gameStarted && (
					<div className="absolute inset-0 flex items-center justify-center">
						<p
							className={`border-2 border-black bg-white px-4 py-2 text-center font-semibold ${phase === "PAUSED" ? "text-red-600" : "text-black"}`}
						>
							{phase === "WAITING"
								? "Waiting for next game"
								: phase === "ROUND_END"
									? "Turn finished"
									: phase === "FINISHED"
										? "Game finished"
										: "Game paused"}
						</p>
					</div>
				)}
			</div>

			<div className="mt-7 flex w-full flex-wrap items-center justify-center gap-4">
				<div
					className="flex items-center gap-2"
					aria-label="Predefined colors"
				>
					{predefinedColors.map((predefinedColor) => (
						<button
							key={predefinedColor}
							type="button"
							disabled={!gameStarted}
							onClick={() => selectColor(predefinedColor)}
							aria-label={`Use color ${predefinedColor}`}
							className="h-7 w-7 rounded-full border-2 border-gray-300 shadow-sm transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
							style={{ backgroundColor: predefinedColor }}
						/>
					))}
				</div>
				<div
					className="flex items-center gap-2"
					aria-label="Recently used colors"
				>
					{[0, 1].map((index) => (
						<button
							key={index}
							type="button"
							disabled={!recentColors[index]}
							onClick={() =>
								recentColors[index] &&
								selectColor(recentColors[index])
							}
							aria-label={
								recentColors[index]
									? `Use recent color ${recentColors[index]}`
									: "No recent color"
							}
							className="h-8 w-8 rounded-sm border-2 border-gray-800 shadow-sm disabled:cursor-not-allowed disabled:bg-gray-100"
							style={
								recentColors[index]
									? { backgroundColor: recentColors[index] }
									: undefined
							}
						/>
					))}
				</div>
				<button
					type="button"
					disabled={!gameStarted}
					onClick={() => {
						setShapeMode("freehand");
						setIsFilling(false);
						setIsPickingColor(false);
						setIsErasing((previousValue) => !previousValue);
					}}
					aria-pressed={isErasing}
					aria-label="Toggle eraser"
					className={
						isErasing
							? activeToolButtonClass
							: inactiveToolButtonClass
					}
				>
					Eraser
				</button>
				<button
					type="button"
					disabled={!gameStarted}
					onClick={() => {
						setIsFilling((previousValue) => !previousValue);
						setIsErasing(false);
						setIsPickingColor(false);
						setShapeMode("freehand");
					}}
					aria-pressed={isFilling}
					className={
						isFilling
							? activeToolButtonClass
							: inactiveToolButtonClass
					}
				>
					Fill
				</button>
				<button
					type="button"
					disabled={!gameStarted}
					onClick={() => {
						setShapeMode((previousMode) =>
							previousMode === "rectangle"
								? "freehand"
								: "rectangle",
						);
						setIsErasing(false);
						setIsFilling(false);
						setIsPickingColor(false);
					}}
					aria-pressed={shapeMode === "rectangle"}
					className={
						shapeMode === "rectangle"
							? activeToolButtonClass
							: inactiveToolButtonClass
					}
				>
					Rectangle
				</button>
				<button
					type="button"
					disabled={!gameStarted}
					onClick={() => {
						setShapeMode((previousMode) =>
							previousMode === "circle" ? "freehand" : "circle",
						);
						setIsErasing(false);
						setIsFilling(false);
						setIsPickingColor(false);
					}}
					aria-pressed={shapeMode === "circle"}
					className={
						shapeMode === "circle"
							? activeToolButtonClass
							: inactiveToolButtonClass
					}
				>
					Circle
				</button>
				<input
					type="color"
					disabled={!gameStarted}
					value={color}
					onChange={(e) => {
						setColor(e.target.value);
						setIsErasing(false);
					}}
					onBlur={() => commitRecentColor(color)}
					className="h-8 w-8 overflow-hidden rounded-full border-0 p-0"
				/>
				<button
					type="button"
					disabled={!gameStarted}
					onClick={() =>
						setIsPickingColor((previousValue) => !previousValue)
					}
					aria-pressed={isPickingColor}
					className={
						isPickingColor
							? activeToolButtonClass
							: inactiveToolButtonClass
					}
				>
					Pick color
				</button>
				<input
					type="range"
					disabled={!gameStarted}
					value={size}
					min={1}
					max={50}
					onChange={(e) => setSize(Number(e.target.value))}
					aria-label="Brush size"
				/>
				<input
					type="number"
					disabled={!gameStarted}
					value={size}
					min={1}
					max={50}
					onChange={(e) => setSize(Number(e.target.value))}
				/>
				<button
					type="button"
					disabled={!gameStarted}
					onClick={clearDrawing}
					className={inactiveToolButtonClass}
				>
					Clear
				</button>
			</div>
		</div>
	);
}
