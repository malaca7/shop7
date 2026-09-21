import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const itemsToClean = [
  "index.html",
  "404.html",
  "assets",
  "auth",
  "minha-conta",
  "moderacao",
];

for (const item of itemsToClean) {
  const fullPath = path.join(rootDir, item);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`[clean-root] Removido temporariamente para o build: ${item}`);
  }
}
