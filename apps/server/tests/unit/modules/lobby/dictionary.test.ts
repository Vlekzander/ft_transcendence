import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let tmpRoot: string;

// The module reads the disk at import time: process.cwd() is pointed to a
// temporary folder holding data/dictionaries, then the module is re-imported.
async function loadWith(files: Record<string, string>) {
	const dir = path.join(tmpRoot, "data", "dictionaries");
	fs.mkdirSync(dir, { recursive: true });
	for (const [name, content] of Object.entries(files))
		fs.writeFileSync(path.join(dir, name), content);

	vi.spyOn(process, "cwd").mockReturnValue(tmpRoot);
	vi.resetModules();
	return (await import("@/modules/lobby/dictionary")).DEFAULT_DICTIONARY;
}

const ALL_FILES = {
	"easy.txt": "cat\ndog",
	"medium.txt": "hedgehog\nlamp",
	"hard.txt": "cosmos\nasteroid",
};

describe("modules/lobby/dictionary", () => {
	beforeEach(() => {
		tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dict-test-"));
	});

	afterEach(() => {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	});

	it("Level 0 is always empty", async () => {
		const dict = await loadWith(ALL_FILES);

		expect(dict[0]).toEqual([]);
	});

	it("Maps levels 1, 2 and 3 to easy, medium and hard", async () => {
		const dict = await loadWith(ALL_FILES);

		expect(dict[1]).toEqual(["cat", "dog"]);
		expect(dict[2]).toEqual(["hedgehog", "lamp"]);
		expect(dict[3]).toEqual(["cosmos", "asteroid"]);
		expect(Object.keys(dict)).toEqual(["0", "1", "2", "3"]);
	});

	it("Does not depend on the order files were created in", async () => {
		const dict = await loadWith({
			"hard.txt": "zzz",
			"medium.txt": "mmm",
			"easy.txt": "aaa",
		});

		expect(dict[1]).toEqual(["aaa"]);
		expect(dict[2]).toEqual(["mmm"]);
		expect(dict[3]).toEqual(["zzz"]);
	});

	it("Trims, lowercases and drops empty lines (incl. CRLF)", async () => {
		const dict = await loadWith({
			...ALL_FILES,
			"easy.txt": "  Cat \r\n\r\nDOG\n\n   \nBird\r\n",
		});

		expect(dict[1]).toEqual(["cat", "dog", "bird"]);
	});

	it("Ignores files that are not referenced", async () => {
		const dict = await loadWith({
			...ALL_FILES,
			"extra.txt": "ignored",
			"notes.md": "ignored",
		});

		expect(Object.keys(dict)).toEqual(["0", "1", "2", "3"]);
		expect(Object.values(dict).flat()).not.toContain("ignored");
	});

	it("Throws at import when a referenced file is missing", async () => {
		const { "hard.txt": _hard, ...withoutHard } = ALL_FILES;
		const dir = path.join(tmpRoot, "data", "dictionaries");
		fs.mkdirSync(dir, { recursive: true });
		for (const [name, content] of Object.entries(withoutHard))
			fs.writeFileSync(path.join(dir, name), content);
		vi.spyOn(process, "cwd").mockReturnValue(tmpRoot);
		vi.resetModules();

		await expect(import("@/modules/lobby/dictionary")).rejects.toThrow(
			/ENOENT/,
		);
	});

	it("Throws at import when the dictionary folder is missing", async () => {
		vi.spyOn(process, "cwd").mockReturnValue(tmpRoot);
		vi.resetModules();

		await expect(import("@/modules/lobby/dictionary")).rejects.toThrow(
			/ENOENT/,
		);
	});
});

// Checks the real files of the repo (cwd = apps/server)
describe("modules/lobby/dictionary (real data)", () => {
	it("Provides non-empty easy, medium and hard dictionaries", async () => {
		vi.resetModules();
		const { DEFAULT_DICTIONARY } =
			await import("@/modules/lobby/dictionary");

		expect(DEFAULT_DICTIONARY[0]).toEqual([]);
		for (const level of [1, 2, 3])
			expect(DEFAULT_DICTIONARY[level].length).toBeGreaterThan(0);
	});

	it("Only has lowercase, trimmed, non-empty words", async () => {
		vi.resetModules();
		const { DEFAULT_DICTIONARY } =
			await import("@/modules/lobby/dictionary");

		for (const words of Object.values(DEFAULT_DICTIONARY))
			for (const word of words) {
				expect(word).toBe(word.trim().toLowerCase());
				expect(word.length).toBeGreaterThan(0);
			}
	});
});
