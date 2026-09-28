import { registerMsgSockets } from "./modules/msg/msg.socket";

export function registerAllSockets(): void {
	registerMsgSockets();
}
