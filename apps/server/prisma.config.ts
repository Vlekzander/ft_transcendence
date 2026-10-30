import { defineConfig } from "prisma/config";

function databaseUrl(): string {
	const url = process.env.DB_URL;
	if (url) return url;

	const host = process.env.DB_HOST || "localhost";
	const dbName = process.env.DB_NAME || "postgres";
	const user = encodeURIComponent(process.env.DB_USER || "");
	const pass = encodeURIComponent(process.env.DB_PASSWORD || "");
	const port = process.env.DB_PORT || "5432";

	return `postgresql://${user}:${pass}@${host}:${port}/${dbName}`;
}

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: databaseUrl(),
	},
});
