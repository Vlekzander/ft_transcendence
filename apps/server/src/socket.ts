import { registerMsgSockets } from "./modules/msg/msg.socket";
import { registerGameSockets } from "./modules/lobby/game.socket";

export function registerAllSockets(): void {
	registerMsgSockets();
	registerGameSockets();
}
