import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./tests/setup.ts"],
		include: ["tests/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			include: ["src/**/*.ts"],
			exclude: ["src/generated/**", "src/**/*.d.ts", "src/**/index.ts"],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@tests": path.resolve(__dirname, "./tests"),
		},
	},
});
