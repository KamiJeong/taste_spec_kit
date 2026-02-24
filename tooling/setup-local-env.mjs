import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const force = process.argv.includes("--force");

const pairs = [
  [".env.template", ".env"],
  ["apps/api/.env.template", "apps/api/.env"],
  ["apps/api/.env.test.template", "apps/api/.env.test"]
];

for (const [from, to] of pairs) {
  const src = resolve(root, from);
  const dest = resolve(root, to);
  if (!existsSync(src)) continue;
  const existedBefore = existsSync(dest);
  if (!existedBefore || force) {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    console.log(`${existedBefore ? "updated" : "created"}: ${to}`);
  } else {
    console.log(`exists: ${to}`);
  }
}
