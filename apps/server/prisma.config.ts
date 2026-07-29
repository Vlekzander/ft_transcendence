import { defineConfig } from "prisma/config";
import { databaseUrl } from "./src/lib/prisma.lib";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: databaseUrl(),
	},
});
