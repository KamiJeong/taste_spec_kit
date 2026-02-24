import assert from "node:assert/strict";
import "../load-env";

assert.equal(process.env.NODE_ENV, "test");
assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for integration tests");
assert.ok(process.env.REDIS_URL, "REDIS_URL is required for integration tests");
console.log("integration: env scaffold ok");
