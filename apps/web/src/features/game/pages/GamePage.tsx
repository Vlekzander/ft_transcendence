import Game from "../components/Game";
import Lobby from "../components/Lobby";

export default function GamePage() {
	return (
		<div className="grow min-h-0 flex flex-row items-stretch gap-2">
			<div className="flex min-h-0 flex-1">
				<Lobby />
			</div>
			<div className="flex min-h-0 flex-1 items-center justify-center">
				<Game />
			</div>
		</div>
	);
}
// check comment rendre le dessin live
