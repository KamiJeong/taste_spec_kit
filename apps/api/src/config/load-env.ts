import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(pathname: string): void {
  if (!existsSync(pathname)) return;
  const content = readFileSync(pathname, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function loadApiEnv(): void {
  const apiRoot = resolve(__dirname, "../..");
  loadEnvFile(resolve(apiRoot, ".env"));
  if (process.env.NODE_ENV === "test") {
    loadEnvFile(resolve(apiRoot, ".env.test"));
  }
}
