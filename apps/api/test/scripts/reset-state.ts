import assert from "node:assert/strict";
import { Client as PgClient } from "pg";
import { createClient } from "redis";
import "../load-env";

async function resetDatabase() {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  const client = new PgClient({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("TRUNCATE TABLE audit_logs, password_reset_tokens, verification_tokens, users RESTART IDENTITY CASCADE");
  } finally {
    await client.end();
  }
}

async function resetRedis() {
  assert.ok(process.env.REDIS_URL, "REDIS_URL is required");
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();
  try {
    await redis.flushDb();
  } finally {
    await redis.quit();
  }
}

async function run() {
  await resetDatabase();
  await resetRedis();
  console.log("test-script: state reset ok (postgres + redis)");
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
