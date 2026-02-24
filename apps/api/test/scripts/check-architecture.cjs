const fs = require("node:fs");
const path = require("node:path");

const modulesRoot = path.resolve(__dirname, "../../src/modules");

function listTsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTsFiles(full));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!full.endsWith(".ts")) continue;
    if (full.endsWith(".d.ts")) continue;
    out.push(full);
  }
  return out;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function extractImports(content) {
  const imports = [];
  const pattern = /from\s+["']([^"']+)["']/g;
  for (const match of content.matchAll(pattern)) {
    imports.push(match[1]);
  }
  return imports;
}

const files = listTsFiles(modulesRoot);
const failures = [];

for (const file of files) {
  const rel = toPosix(path.relative(modulesRoot, file));
  const content = fs.readFileSync(file, "utf8");
  const imports = extractImports(content);

  for (const spec of imports) {
    if (rel.endsWith(".controller.ts") && spec.startsWith("../") && !spec.startsWith("../shared/")) {
      failures.push(`[controller-boundary] ${rel} imports ${spec}`);
    }

    if (rel.startsWith("auth/") && spec.startsWith("../user/")) {
      failures.push(`[auth-user-boundary] ${rel} imports ${spec}`);
    }

    if (rel.startsWith("user/") && spec.startsWith("../auth/")) {
      failures.push(`[user-auth-boundary] ${rel} imports ${spec}`);
    }

    if (!rel.startsWith("persistence/") && (spec === "pg" || spec.startsWith("drizzle-orm"))) {
      failures.push(`[db-boundary] ${rel} imports ${spec}`);
    }

    if (!rel.startsWith("session/") && spec === "redis") {
      failures.push(`[redis-boundary] ${rel} imports ${spec}`);
    }
  }
}

if (failures.length > 0) {
  console.error("architecture guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("architecture guard ok");
