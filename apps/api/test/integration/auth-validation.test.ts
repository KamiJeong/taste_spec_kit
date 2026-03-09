import assert from "node:assert/strict";
import "../load-env";
import { createApp } from "../../src/main";

async function requestJson(
  baseUrl: string,
  path: string,
  options: { method?: string; body?: unknown; cookie?: string; headers?: Record<string, string> } = {}
) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.headers ?? {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const json = (await res.json()) as any;
  return { status: res.status, headers: res.headers, body: json };
}

function readCookie(raw: string | null, name: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(new RegExp(`${name}=([^;,\n]+)`));
  if (!match) return undefined;
  return decodeURIComponent(match[1]);
}

async function run() {
  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const invalidSignup = await requestJson(baseUrl, "/api/v1/auth/signup", {
      method: "POST",
      body: { email: "invalid-email", password: "short" }
    });
    assert.equal(invalidSignup.status, 400);
    assert.equal(invalidSignup.body.code, "VALIDATION_ERROR");

    const invalidVerify = await requestJson(baseUrl, "/api/v1/auth/verify-email?token=");
    assert.equal(invalidVerify.status, 400);
    assert.equal(invalidVerify.body.code, "VALIDATION_ERROR");

    const invalidLogin = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "not-an-email", password: "" }
    });
    assert.equal(invalidLogin.status, 400);
    assert.equal(invalidLogin.body.code, "VALIDATION_ERROR");

    const email = `validation-${Date.now()}@example.com`;
    const signup = await requestJson(baseUrl, "/api/v1/auth/signup", {
      method: "POST",
      body: { email, password: "Passw0rd!", name: "Validation User" }
    });
    assert.equal(signup.status, 201);
    const verify = await requestJson(baseUrl, `/api/v1/auth/verify-email?token=${signup.body.data.verificationToken}`);
    assert.equal(verify.status, 200);
    const login = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email, password: "Passw0rd!" }
    });
    assert.equal(login.status, 200);
    const accessToken = login.body?.data?.accessToken as string | undefined;
    assert.ok(accessToken);
    const csrf = readCookie(login.headers.get("set-cookie"), "csrfToken");
    assert.ok(csrf);
    const csrfCookie = `csrfToken=${encodeURIComponent(csrf!)}`;

    const invalidPatch = await requestJson(baseUrl, "/api/v1/users/profile", {
      method: "PATCH",
      cookie: csrfCookie,
      headers: { authorization: `Bearer ${accessToken}`, "x-csrf-token": csrf! },
      body: {}
    });
    assert.equal(invalidPatch.status, 400);
    assert.equal(invalidPatch.body.code, "VALIDATION_ERROR");

    const invalidDeactivate = await requestJson(baseUrl, "/api/v1/users/deactivate", {
      method: "POST",
      cookie: csrfCookie,
      headers: { authorization: `Bearer ${accessToken}`, "x-csrf-token": csrf! },
      body: { password: "" }
    });
    assert.equal(invalidDeactivate.status, 400);
    assert.equal(invalidDeactivate.body.code, "VALIDATION_ERROR");

    console.log("integration: auth/user validation scenarios ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
