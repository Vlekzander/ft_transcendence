import { readEnv } from "../utils/env.util";
let url = readEnv("DB_URL");

export function databaseUrl(): string {
	if (url) return url;

	const host = readEnv("DB_HOST");
	const dbName = readEnv("DB_NAME");
	const user = encodeURIComponent(readEnv("DB_USER") || "");
	const pass = encodeURIComponent(readEnv("DB_PASSWORD") || "");
	const port = "5432";

	url = `postgresql://${user}:${pass}@${host}:${port}/${dbName}`;

	return url;
}
