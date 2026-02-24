import assert from "node:assert/strict";
import "../load-env";
import { createApp } from "../../src/main";

async function requestJson(
  baseUrl: string,
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const json = (await res.json()) as any;
  return { status: res.status, headers: res.headers, body: json };
}

function assertIsoDate(value: unknown): void {
  assert.equal(typeof value, "string");
  const timestamp = Date.parse(String(value));
  assert.ok(!Number.isNaN(timestamp), `invalid ISO timestamp: ${String(value)}`);
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
      headers: { "x-request-id": "req-envelope-success" },
      body: { email: "envelope@example.com", password: "Passw0rd!" }
    });
    assert.equal(signup.status, 201);
    assert.equal(signup.headers.get("x-request-id"), "req-envelope-success");
    assert.equal(signup.body.success, true);
    assertIsoDate(signup.body.meta?.serverTime);

    const invalidLogin = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      headers: { "x-request-id": "req-envelope-error" },
      body: { email: "invalid-email", password: "" }
    });
    assert.equal(invalidLogin.status, 400);
    assert.equal(invalidLogin.headers.get("x-request-id"), "req-envelope-error");
    assert.equal(invalidLogin.body.success, false);
    assertIsoDate(invalidLogin.body.meta?.serverTime);

    console.log("integration: envelope and request-id scenarios ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
