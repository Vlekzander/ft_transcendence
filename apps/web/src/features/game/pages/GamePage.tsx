import Game from "../components/Game";

export default function GamePage() {
	return (
		<div className="grow flex flex-col justify-center items-center gap-4">
			<h1 className="text-3xl font-bold">Game</h1>
			<Game></Game>
		</div>
	);
}
