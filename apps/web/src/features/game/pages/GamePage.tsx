import Game from "../components/Game";

export default function GamePage() {
	return (
		<div className="grow flex justify-center items-center gap-4">
			<div className="grow flex flex-col justify-center items-center gap-2">
				<h1 className="text-3xl font-bold">Game ID</h1>
				<Game></Game>
			</div>
		</div>
	);
}
// anti aliasing canvas
// add flood-fill
// forme geo ???
// add couleurs predef et slots favoris/last
// check comment rendre le dessin live
