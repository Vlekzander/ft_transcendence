import { registerChatSockets } from "./modules/chat/chat.socket";

export function registerAllSockets(): void {
	registerChatSockets();
}
