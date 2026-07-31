import "dotenv/config";
import * as fs from "fs";

export function readSecret(secret: string): string | undefined {
	const path = `/run/secrets/${secret}`;

	try {
		return fs.readFileSync(path, "utf-8").trim();
	} catch {
		return undefined;
	}
}

export function readEnv(env: string): string | undefined {
	const value = process.env[env];

	return value && value.trim() !== "" ? value : undefined;
}
