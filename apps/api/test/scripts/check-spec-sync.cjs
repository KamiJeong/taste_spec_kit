const fs = require("node:fs");
const path = require("node:path");

const specPath = path.resolve(__dirname, "../../../../specs/02-email-auth-backend/spec.md");
const authContractPath = path.resolve(__dirname, "../../../../specs/02-email-auth-backend/contracts/auth-api.md");
const userContractPath = path.resolve(__dirname, "../../../../specs/02-email-auth-backend/contracts/user-api.md");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseSpecSurface(content) {
  const set = new Set();
  const endpointPattern = /-\s+`(\/api\/v1\/[^`]+)`\s+`(GET|POST|PATCH|PUT|DELETE)`/g;
  for (const match of content.matchAll(endpointPattern)) {
    const method = match[2];
    const route = match[1];
    set.add(`${method} ${route}`);
  }
  return set;
}

function parseContract(content) {
  const basePathMatch = content.match(/Base Path:\s+`([^`]+)`/);
  if (!basePathMatch) {
    throw new Error("missing Base Path section");
  }
  const basePath = basePathMatch[1];
  const set = new Set();
  const endpointPattern = /\d+\.\s+`(GET|POST|PATCH|PUT|DELETE)\s+(\/[^`]+)`/g;
  for (const match of content.matchAll(endpointPattern)) {
    const method = match[1];
    const subPath = match[2];
    set.add(`${method} ${basePath}${subPath}`);
  }
  return set;
}

function setDiff(left, right) {
  const out = [];
  for (const item of left) {
    if (!right.has(item)) out.push(item);
  }
  return out;
}

const spec = read(specPath);
const authContract = read(authContractPath);
const userContract = read(userContractPath);

const specSet = parseSpecSurface(spec);
const contractSet = new Set([...parseContract(authContract), ...parseContract(userContract)]);

const missingInSpec = setDiff(contractSet, specSet);
const missingInContracts = setDiff(specSet, contractSet);

const failures = [];

if (missingInSpec.length > 0) {
  failures.push(`missing in spec: ${missingInSpec.join(", ")}`);
}
if (missingInContracts.length > 0) {
  failures.push(`missing in contracts: ${missingInContracts.join(", ")}`);
}

const requiredSpecMarkers = [
  "v1 기본 전송 계층은 REST",
  "GraphQL은 v1 범위에서 필수 구현 대상이 아니다"
];
for (const marker of requiredSpecMarkers) {
  if (!spec.includes(marker)) {
    failures.push(`spec marker missing: ${marker}`);
  }
}

if (failures.length > 0) {
  console.error("spec sync guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("spec sync guard ok");
