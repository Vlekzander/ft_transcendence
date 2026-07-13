import { TokenPayload } from "../utils/token.util";

declare module "express-serve-static-core" {
	interface Request {
		user?: TokenPayload;
	}
}
