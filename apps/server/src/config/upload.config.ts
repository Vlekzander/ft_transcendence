import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const UPLOAD_DIR = path.resolve(dirname, "../../uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
