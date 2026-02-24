import assert from "node:assert/strict";
import { Client } from "pg";
import "../load-env";

async function run() {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const tables = [
      { schema: "drizzle", table: "__drizzle_migrations" },
      { schema: "public", table: "users" },
      { schema: "public", table: "verification_tokens" },
      { schema: "public", table: "password_reset_tokens" },
      { schema: "public", table: "audit_logs" }
    ];

    for (const item of tables) {
      const result = await client.query(
        "SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = $1 AND tablename = $2) AS exists",
        [item.schema, item.table]
      );
      assert.equal(
        result.rows[0]?.exists,
        true,
        `expected table ${item.schema}.${item.table} to exist after db:migrate`
      );
    }

    const migrationCount = await client.query('SELECT COUNT(*)::int AS count FROM "drizzle"."__drizzle_migrations"');
    assert.ok(migrationCount.rows[0].count >= 1, "expected at least one applied migration");

    console.log("integration: drizzle migration verification ok");
  } finally {
    await client.end();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
