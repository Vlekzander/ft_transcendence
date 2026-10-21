import { registerGameChatSockets } from "./modules/game-chat/game-chat.socket";
import { registerMsgSockets } from "./modules/msg/msg.socket";

export function registerAllSockets(): void {
	registerMsgSockets();
	registerGameChatSockets();
}
