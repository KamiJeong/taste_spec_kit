import assert from "node:assert/strict";
import { createApp } from "../../src/main";

async function expectBootFailure(
  envPatch: Record<string, string | undefined>,
  messageIncludes: string
): Promise<void> {
  const backups: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(envPatch)) {
    backups[key] = process.env[key];
    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  let app: Awaited<ReturnType<typeof createApp>> | null = null;
  try {
    app = await createApp();
    await app.listen(0);
    assert.fail(`expected bootstrap to fail: ${messageIncludes}`);
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    assert.ok(
      text.includes(messageIncludes),
      `expected error to include "${messageIncludes}", got "${text}"`
    );
  } finally {
    if (app) {
      await app.close().catch(() => undefined);
    }
    for (const [key, value] of Object.entries(backups)) {
      if (typeof value === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

async function run() {
  const validDatabaseUrl = process.env.DATABASE_URL ?? "postgresql://kami:ilovekami@localhost:5432/taste_spec_kit";
  const validRedisUrl = process.env.REDIS_URL ?? "redis://:ilovekami@localhost:6379";

  await expectBootFailure(
    { DATABASE_URL: undefined, REDIS_URL: validRedisUrl, ALLOW_INMEMORY_FALLBACK: "false" },
    "DATABASE_URL is required"
  );
  await expectBootFailure(
    { DATABASE_URL: validDatabaseUrl, REDIS_URL: undefined, ALLOW_INMEMORY_FALLBACK: "false" },
    "REDIS_URL is required"
  );
  await expectBootFailure(
    { DATABASE_URL: "postgresql://kami:ilovekami@localhost:1/taste_spec_kit", REDIS_URL: validRedisUrl, ALLOW_INMEMORY_FALLBACK: "false" },
    "connect"
  );
  await expectBootFailure(
    { DATABASE_URL: validDatabaseUrl, REDIS_URL: "redis://:ilovekami@localhost:1", ALLOW_INMEMORY_FALLBACK: "false" },
    "connect"
  );

  console.log("integration: fail-fast env/connectivity scenarios ok");
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
