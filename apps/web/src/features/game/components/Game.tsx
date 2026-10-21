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
	DrawStrokePacket,
	GamePhase,
	GameStatePacket,
	JoinGamePacket,
} from "@ft_transcendence/shared";
import { getLobby } from "../../lobby/services/lobby.service";
import { useAuth } from "../../auth/context/AuthContext";
import { useWebSocket } from "../../websocket/context/WebSocketContext";
import { useWsEvent } from "../../websocket/hooks/useWsEvent";

const LOBBY_REFRESH_INTERVAL_MS = 3000;

export default function Game() {
	const { uuid } = useParams<{ uuid: string }>();
	const { user } = useAuth();
	const { sendPacket } = useWebSocket();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const lastPointRef = useRef<{ x: number; y: number } | null>(null);
	const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
	const shapeSnapshotRef = useRef<ImageData | null>(null);
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
	const [gameStarted, setGameStarted] = useState(false);
	const [phase, setPhase] = useState<GamePhase>("WAITING");
	const [drawerId, setDrawerId] = useState<string | null>(null);
	const [choices, setChoices] = useState<string[]>([]);
	const [selectedWord, setSelectedWord] = useState<string | null>(null);
	const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
	const [clock, setClock] = useState(() => Date.now());
	const [playerNumber, setPlayerNumber] = useState(0);
	const [totalPlayers, setTotalPlayers] = useState(0);
	const [round, setRound] = useState(0);
	const [totalRounds, setTotalRounds] = useState(0);
	const previousDrawingRef = useRef<string | null>(null);
	const isDrawer = user?.uuid === drawerId;
	const canDraw = gameStarted && phase === "DRAWING" && isDrawer;

	const handleGameState = useCallback(
		(packet: GameStatePacket) => {
			if (packet.lobbyUuid !== uuid) return;
			setPhase(packet.phase);
			setGameStarted(
				packet.phase === "CHOOSING" || packet.phase === "DRAWING",
			);
			setRound(packet.round);
			setTotalRounds(packet.totalRounds);
			setDrawerId(packet.drawerId);
			setPlayerNumber(packet.playerNumber);
			setTotalPlayers(packet.totalPlayers);
			setChoices(packet.choices);
			setSelectedWord(packet.selectedWord);
			setTimerEndsAt(packet.timerEndsAt);
			const drawingKey = `${packet.round}:${packet.drawerId}`;
			if (
				(packet.phase === "CHOOSING" || packet.phase === "DRAWING") &&
				previousDrawingRef.current !== drawingKey
			) {
				canvasRef.current
					?.getContext("2d")
					?.clearRect(
						0,
						0,
						canvasRef.current?.width ?? 0,
						canvasRef.current?.height ?? 0,
					);
				previousDrawingRef.current = drawingKey;
			}
		},
		[uuid],
	);
	useWsEvent("GAME_STATE", handleGameState);

	const handleRemoteStroke = useCallback(
		(packet: DrawStrokePacket) => {
			if (packet.lobbyUuid !== uuid) return;
			const ctx = canvasRef.current?.getContext("2d");
			if (!ctx) return;
			ctx.strokeStyle = packet.color;
			ctx.lineWidth = packet.size;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.globalCompositeOperation = packet.eraser
				? "destination-out"
				: "source-over";
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
			const ctx = canvas?.getContext("2d");
			if (!canvas || !ctx) return;
			const action = packet.action;
			if (action.kind === "CLEAR") {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				return;
			}
			if (action.kind === "FILL") {
				floodFill(action.x, action.y, action.color);
				return;
			}
			ctx.strokeStyle = action.color;
			ctx.lineWidth = action.size;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.globalCompositeOperation = action.eraser
				? "destination-out"
				: "source-over";
			drawShape(ctx, action.mode, action.from, action.to);
		},
		[uuid],
	);
	useWsEvent("DRAW_ACTION", handleRemoteAction);

	useEffect(() => {
		if (!uuid) return;
		const refresh = () => {
			void getLobby(uuid).then((res) => {
				if (res.ok) setGameStarted(res.data.gameStarted);
			});
		};
		refresh();
		const interval = setInterval(refresh, LOBBY_REFRESH_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [uuid]);

	useEffect(() => {
		if (!uuid) return;
		const packet: JoinGamePacket = { type: "JOIN_GAME", lobbyUuid: uuid };
		sendPacket(packet);
		const interval = setInterval(() => sendPacket(packet), 1000);
		return () => clearInterval(interval);
	}, [sendPacket, uuid]);

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

	function floodFill(x: number, fillY: number, fillColorValue = color) {
		const y = fillY;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

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
			if (currentX < canvas.width - 1)
				stack.push([currentX + 1, currentY]);
			if (currentY > 0) stack.push([currentX, currentY - 1]);
			if (currentY < canvas.height - 1)
				stack.push([currentX, currentY + 1]);
		}

		ctx.putImageData(imageData, 0, 0);
	}

	const startDrawing = (e: PointerEvent<HTMLCanvasElement>) => {
		if (!gameStarted || phase !== "DRAWING" || !isDrawer || e.button !== 0)
			return;

		const ctx = e.currentTarget.getContext("2d");
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
			floodFill(x, y);
			sendPacket({
				type: "DRAW_ACTION",
				lobbyUuid: uuid ?? "",
				action: { kind: "FILL", x, y, color },
			});
			setIsFilling(false);
			return;
		}

		e.currentTarget.setPointerCapture(e.pointerId);

		const { x, y } = getMousePosition(e);

		ctx.strokeStyle = color;
		ctx.lineWidth = size;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.imageSmoothingEnabled = true;
		ctx.globalCompositeOperation = isErasing
			? "destination-out"
			: "source-over";

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

		ctx.beginPath();
		ctx.moveTo(x, y);
		lastPointRef.current = { x, y };
	};

	const draw = (e: PointerEvent<HTMLCanvasElement>) => {
		if (!gameStarted || phase !== "DRAWING" || !isDrawer || !isDrawing)
			return;

		const ctx = e.currentTarget.getContext("2d");
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
			const ctx = e.currentTarget.getContext("2d");
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
			setShapeMode("freehand");
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

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
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
					Round {round}/{totalRounds} Player {playerNumber}/
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
			<div className="w-full">
				<canvas
					ref={canvasRef}
					width={1280}
					height={720}
					className={`block h-auto w-full touch-none border-4 border-gray-800 ${phase === "DRAWING" ? "bg-white" : "bg-gray-400"}`}
					onPointerDown={startDrawing}
					onPointerMove={draw}
					onPointerUp={stopDrawing}
					onPointerCancel={stopDrawing}
				/>
				{!gameStarted && (
					<p className="mt-2 text-center font-semibold text-gray-600">
						{phase === "WAITING"
							? "Waiting for next game"
							: "Game paused"}
					</p>
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
						setIsFilling(true);
						setIsErasing(false);
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
					onClick={() => setIsPickingColor(true)}
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
