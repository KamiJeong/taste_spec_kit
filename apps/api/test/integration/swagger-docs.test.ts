import assert from "node:assert/strict";
import "../load-env";
import { createApp } from "../../src/main";

type EnvKey = "API_DOCS_ENABLED" | "API_DOCS_PROTECTED";

async function startWithEnv(envPatch: Partial<Record<EnvKey, string>>) {
  const backup: Partial<Record<EnvKey, string | undefined>> = {};
  for (const key of Object.keys(envPatch) as EnvKey[]) {
    backup[key] = process.env[key];
    process.env[key] = envPatch[key];
  }

  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    app,
    baseUrl,
    restore: () => {
      for (const key of Object.keys(envPatch) as EnvKey[]) {
        const value = backup[key];
        if (typeof value === "undefined") delete process.env[key];
        else process.env[key] = value;
      }
    }
  };
}

async function run() {
  {
    const ctx = await startWithEnv({ API_DOCS_ENABLED: "true", API_DOCS_PROTECTED: "false" });
    try {
      const docsHtml = await fetch(`${ctx.baseUrl}/api/docs`).then((r) => r.text());
      const json = await fetch(`${ctx.baseUrl}/api-json`).then((r) => r.json() as Promise<any>);
      assert.ok(docsHtml.includes("swagger-ui"), "swagger ui html missing");
      assert.ok(typeof json?.openapi === "string", "openapi field missing");
    } finally {
      await ctx.app.close();
      ctx.restore();
    }
  }

  {
    const ctx = await startWithEnv({ API_DOCS_ENABLED: "true", API_DOCS_PROTECTED: "true" });
    try {
      const docsRes = await fetch(`${ctx.baseUrl}/api/docs`);
      const jsonRes = await fetch(`${ctx.baseUrl}/api-json`);
      assert.equal(docsRes.status, 403);
      assert.equal(jsonRes.status, 403);
    } finally {
      await ctx.app.close();
      ctx.restore();
    }
  }

  {
    const ctx = await startWithEnv({ API_DOCS_ENABLED: "false", API_DOCS_PROTECTED: "false" });
    try {
      const docsRes = await fetch(`${ctx.baseUrl}/api/docs`);
      const jsonRes = await fetch(`${ctx.baseUrl}/api-json`);
      assert.equal(docsRes.status, 404);
      assert.equal(jsonRes.status, 404);
    } finally {
      await ctx.app.close();
      ctx.restore();
    }
  }

  console.log("integration: swagger docs scenarios ok");
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
