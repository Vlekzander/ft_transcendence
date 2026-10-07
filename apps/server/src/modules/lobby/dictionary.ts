import fs from "node:fs";
import path from "node:path";

const DICTIONARY_DIR = path.resolve(process.cwd(), "data/dictionaries");

const FILES: Record<number, string | null> = {
	0: null,
};

const dictionaryFiles = fs
	.readdirSync(DICTIONARY_DIR, { withFileTypes: true })
	.filter((entry) => entry.isFile() && entry.name.endsWith(".txt"))
	.map((entry) => entry.name);

const uniqueFiles = [...new Set(dictionaryFiles)];

uniqueFiles.forEach((file, index) => {
	FILES[index + 1] = file;
});

function load(file: string | null): string[] {
	if (!file) return [];
	const content = fs.readFileSync(path.join(DICTIONARY_DIR, file), "utf-8");
	return content
		.split("\n")
		.map((w) => w.trim().toLowerCase())
		.filter(Boolean);
}

export const DEFAULT_DICTIONARY: Record<number, string[]> = Object.fromEntries(
	Object.entries(FILES).map(([level, file]) => [level, load(file)]),
);
