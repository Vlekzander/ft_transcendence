// command to run this test: npm run test:server -- tests/unit/modules/lobby/dictionary.test.ts --run
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let tmpRoot: string;

// The module reads the disk at import: we point process.cwd() to a temporary
// directory containing data/dictionaries, then we (re)import the module.
async function loadWith(files: Record<string, string>) {
	const dir = path.join(tmpRoot, "data", "dictionaries");
	fs.mkdirSync(dir, { recursive: true });
	for (const [name, content] of Object.entries(files))
		fs.writeFileSync(path.join(dir, name), content);

	vi.spyOn(process, "cwd").mockReturnValue(tmpRoot);
	vi.resetModules();
	return (await import("@/modules/lobby/dictionary")).DEFAULT_DICTIONARY;
}

describe("modules/lobby/dictionary", () => {
	beforeEach(() => {
		tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dict-test-"));
	});

	afterEach(() => {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	});

	it("Level 0 is always empty", async () => {
		const dict = await loadWith({ "easy.txt": "cat\ndog" });

		expect(dict[0]).toEqual([]);
	});

	it("Assigns levels 1..n to the .txt files", async () => {
		const dict = await loadWith({
			"easy.txt": "cat\ndog",
			"medium.txt": "hedgehog\nlamp",
		});

		expect(Object.keys(dict)).toEqual(["0", "1", "2"]);
		expect(dict[1].length).toBe(2);
		expect(dict[2].length).toBe(2);
	});

	it("Maps easy.txt to level 1 and medium.txt to level 2", async () => {
		// Fails if the order of readdirSync is not alphabetical (not guaranteed by the OS)
		const dict = await loadWith({
			"medium.txt": "hedgehog",
			"easy.txt": "cat",
		});

		expect(dict[1]).toEqual(["cat"]);
		expect(dict[2]).toEqual(["hedgehog"]);
	});

	it("Trims, lowercases and drops empty lines (incl. CRLF)", async () => {
		const dict = await loadWith({
			"easy.txt": "  Cat \r\n\r\nDOG\n\n   \nBird\r\n",
		});

		expect(dict[1]).toEqual(["cat", "dog", "bird"]);
	});

	it("Ignores non-.txt files and directories", async () => {
		const dir = path.join(tmpRoot, "data", "dictionaries");
		fs.mkdirSync(path.join(dir, "sub.txt"), { recursive: true });
		const dict = await loadWith({
			"easy.txt": "cat",
			"notes.md": "ignored",
			".gitkeep": "",
		});

		expect(Object.keys(dict)).toEqual(["0", "1"]);
		expect(dict[1]).toEqual(["cat"]);
	});

	it("Only has level 0 when the folder has no .txt file", async () => {
		const dict = await loadWith({});

		expect(dict).toEqual({ 0: [] });
	});

	it("Throws at import when the dictionary folder is missing", async () => {
		vi.spyOn(process, "cwd").mockReturnValue(tmpRoot);
		vi.resetModules();

		await expect(import("@/modules/lobby/dictionary")).rejects.toThrow(
			/ENOENT/,
		);
	});
});

// This test is not run in CI because the dictionary files are not present in the Docker image.
describe("modules/lobby/dictionary (real data)", () => {
	it("Provides non-empty levels 1 and 2, as allowed by CreateLobbySchema", async () => {
		vi.resetModules();
		const { DEFAULT_DICTIONARY } =
			await import("@/modules/lobby/dictionary");

		expect(DEFAULT_DICTIONARY[0]).toEqual([]);
		expect(DEFAULT_DICTIONARY[1]?.length).toBeGreaterThan(0);
		expect(DEFAULT_DICTIONARY[2]?.length).toBeGreaterThan(0);
	});
});
