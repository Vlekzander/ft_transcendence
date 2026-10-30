import { databaseUrl } from "@/config/db.config";

// Integration fixtures delete rows. Never run them against an application DB.
export function assertTestDatabase() {
	const name = new URL(databaseUrl()).pathname.slice(1);
	if (!name.endsWith("_test")) {
		throw new Error(
			"Integration tests require a dedicated database ending in _test (DB_URL or DB_NAME).",
		);
	}
}
