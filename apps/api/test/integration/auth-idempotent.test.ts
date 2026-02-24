import assert from "node:assert/strict";
import "../load-env";
import { createApp } from "../../src/main";

async function requestJson(
  baseUrl: string,
  path: string,
  options: { method?: string; body?: unknown; cookie?: string } = {}
) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.cookie ? { cookie: options.cookie } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const json = (await res.json()) as any;
  return { status: res.status, headers: res.headers, body: json };
}

async function run() {
  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const signup = await requestJson(baseUrl, "/api/v1/auth/signup", {
      method: "POST",
      body: {
        email: "idempotent@example.com",
        password: "Passw0rd!",
        name: "Idempotent User"
      }
    });
    assert.equal(signup.status, 201);

    const resend1 = await requestJson(baseUrl, "/api/v1/auth/resend-verification", {
      method: "POST",
      body: { email: "idempotent@example.com" }
    });
    assert.equal(resend1.status, 200);
    assert.ok(resend1.body.data.verificationToken);
    assert.equal(resend1.body.data.cooldownActive, undefined);

    const resend2 = await requestJson(baseUrl, "/api/v1/auth/resend-verification", {
      method: "POST",
      body: { email: "idempotent@example.com" }
    });
    assert.equal(resend2.status, 200);
    assert.equal(resend2.body.data.cooldownActive, true);
    assert.equal(resend2.body.data.verificationToken, undefined);

    const forgot1 = await requestJson(baseUrl, "/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "idempotent@example.com" }
    });
    assert.equal(forgot1.status, 200);
    assert.ok(forgot1.body.data.resetToken);
    assert.equal(forgot1.body.data.cooldownActive, undefined);

    const forgot2 = await requestJson(baseUrl, "/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "idempotent@example.com" }
    });
    assert.equal(forgot2.status, 200);
    assert.equal(forgot2.body.data.cooldownActive, true);
    assert.equal(forgot2.body.data.resetToken, undefined);

    console.log("integration: idempotent cooldown scenarios ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
