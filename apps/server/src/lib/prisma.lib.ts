import { PrismaPg } from "@prisma/adapter-pg";
import { readEnv, readSecret } from "../utils/env.util";
import { PrismaClient } from "../generated/prisma/client";

let url = readEnv("DB_URL");

export function databaseUrl(): string {
	if (url) return url;

	const user = readSecret("db_username") ?? readEnv("DB_USER") ?? "user";
	const pass = readSecret("db_password") ?? readEnv("DB_PASSWORD") ?? "pass";
	const host = readEnv("DB_HOST") ?? "localhost";
	const port = readEnv("DB_PORT") ?? "5432";
	const dbName = readEnv("DB_NAME") ?? "app";
	url = `postgresql://${user}:${pass}@${host}:${port}/${dbName}`;

	return url;
}

const adapter = new PrismaPg({ connectionString: databaseUrl() });
const prisma = new PrismaClient({ adapter });

export { prisma };
