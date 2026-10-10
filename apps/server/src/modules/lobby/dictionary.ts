import fs from "node:fs";
import path from "node:path";

const DICTIONARY_DIR = path.resolve(process.cwd(), "data/dictionaries");

const FILES: Record<number, string | null> = {
	0: null,
	1: "easy.txt",
	2: "medium.txt",
	3: "hard.txt",
};

function load(file: string | null): string[] {
	if (!file) return [];
	const content = fs.readFileSync(path.join(DICTIONARY_DIR, file), "utf-8");
	return content
		.split("\n")
		.map((w) => w.trim().toLowerCase())
		.filter(Boolean);
}

export const DEFAULT_DICTIONARY: Record<number, string[]> = Object.fromEntries(
	Object.entries(FILES).map(([index, file]) => [index, load(file)]),
);
