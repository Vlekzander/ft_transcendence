import Game from "../components/Game";

export default function GamePage() {
	return (
		<div className="grow min-h-screen p-5">
			<div className="grid h-full gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
				<aside className="flex flex-col gap-4 border border-gray-300 bg-white p-4">
					<h1 className="text-3xl font-bold">Lobby</h1>
					<div className="flex flex-col gap-2 text-sm text-gray-600">
						<p>Players and room controls will live here.</p>
						<p>Use this panel for lobby details, chat, or turn info.</p>
					</div>
				</aside>

				<main className="flex min-w-0 flex-col gap-4">
					<div className="flex items-center justify-between">
						<h2 className="text-3xl font-bold">Game</h2>
					</div>
					<div className="min-w-0">
						<Game />
					</div>
				</main>
			</div>
		</div>
	);
}
// check comment rendre le dessin live
