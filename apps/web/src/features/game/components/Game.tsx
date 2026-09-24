"use client";

import { useRef, useState, type PointerEvent } from "react";

export default function Game() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [color, setColor] = useState("#000000");
	const [size, setSize] = useState(5);
	const [isPickingColor, setIsPickingColor] = useState(false);

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

	const startDrawing = (e: PointerEvent<HTMLCanvasElement>) => {
		if (e.button !== 0) return;

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

			setColor(hexColor);
			setIsPickingColor(false);
			return;
		}

		e.currentTarget.setPointerCapture(e.pointerId);

		const { x, y } = getMousePosition(e);

		ctx.strokeStyle = color;
		ctx.lineWidth = size;
		ctx.lineCap = "round";

		setIsDrawing(true);

		ctx.beginPath();
		ctx.moveTo(x, y);
	};

	const draw = (e: PointerEvent<HTMLCanvasElement>) => {
		if (!isDrawing) return;

		const ctx = e.currentTarget.getContext("2d");
		if (!ctx) return;

		const { x, y } = getMousePosition(e);

		ctx.lineTo(x, y);
		ctx.stroke();
	};

	const stopDrawing = (e: PointerEvent<HTMLCanvasElement>) => {
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
		setIsDrawing(false);
	};

	const clearDrawing = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

	return (
		<div>
			<div className="w-full">
				<canvas
					ref={canvasRef}
					width={1280}
					height={720}
					className="block h-auto w-full touch-none border-4 border-gray-800"
					onPointerDown={startDrawing}
					onPointerMove={draw}
					onPointerUp={stopDrawing}
					onPointerCancel={stopDrawing}
				/>
			</div>

			<div className="flex w-full flex-row justify-center gap-4 mt-7">
				<button
					type="button"
					onClick={() => setColor("#ffffff")}
					aria-label="Use eraser"
				>
					❌
				</button>
				<input
					type="color"
					value={color}
					onChange={(e) => setColor(e.target.value)}
				/>
				<button
					type="button"
					onClick={() => setIsPickingColor(true)}
					aria-pressed={isPickingColor}
					aria-label="Pick a color from the drawing"
				>
					Pick color
				</button>
				<input
					type="range"
					value={size}
					min={1}
					max={50}
					onChange={(e) => setSize(Number(e.target.value))}
					aria-label="Brush size"
				/>
				<input
					type="number"
					value={size}
					min={1}
					max={50}
					onChange={(e) => setSize(Number(e.target.value))}
				/>
				<button
					className="rounded-sm border-2 pt-0.2 pb-0.2 pl-1 pr-1"
					border-solid
					onClick={clearDrawing}
				>
					Clear
				</button>
			</div>
		</div>
	);
}
