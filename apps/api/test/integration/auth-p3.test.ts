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
    const signup = await requestJson(baseUrl, "/api/v1/auth/signup", {
      method: "POST",
      body: {
        email: "p3@example.com",
        password: "Passw0rd!",
        name: "P3 User"
      }
    });
    assert.equal(signup.status, 201);

    const verify = await requestJson(
      baseUrl,
      `/api/v1/auth/verify-email?token=${signup.body.data.verificationToken}`
    );
    assert.equal(verify.status, 200);

    const login = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "p3@example.com", password: "Passw0rd!" }
    });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get("set-cookie");
    const sid = readCookie(setCookie, "sid");
    const csrf = readCookie(setCookie, "csrfToken");
    assert.ok(sid);
    assert.ok(csrf);
    const cookie = `sid=${encodeURIComponent(sid!)}; csrfToken=${encodeURIComponent(csrf!)}`;

    const invalidDeletionReq = await requestJson(baseUrl, "/api/v1/users/request-deletion", {
      method: "POST",
      cookie,
      headers: { "x-csrf-token": csrf! },
      body: { password: "WrongPassw0rd!" }
    });
    assert.equal(invalidDeletionReq.status, 401);
    assert.equal(invalidDeletionReq.body.code, "AUTH_INVALID_CREDENTIALS");

    const requestDeletion = await requestJson(baseUrl, "/api/v1/users/request-deletion", {
      method: "POST",
      cookie,
      headers: { "x-csrf-token": csrf! },
      body: { password: "Passw0rd!" }
    });
    assert.equal(requestDeletion.status, 200);
    assert.equal(requestDeletion.body.data.accountState, "DELETION_SCHEDULED");
    assert.ok(requestDeletion.body.data.scheduledDeletionAt);

    const cancelDeletion = await requestJson(baseUrl, "/api/v1/users/cancel-deletion", {
      method: "POST",
      cookie,
      headers: { "x-csrf-token": csrf! }
    });
    assert.equal(cancelDeletion.status, 200);
    assert.equal(cancelDeletion.body.data.accountState, "ACTIVE");

    const invalidDeactivate = await requestJson(baseUrl, "/api/v1/users/deactivate", {
      method: "POST",
      cookie,
      headers: { "x-csrf-token": csrf! },
      body: { password: "WrongPassw0rd!" }
    });
    assert.equal(invalidDeactivate.status, 401);
    assert.equal(invalidDeactivate.body.code, "AUTH_INVALID_CREDENTIALS");

    const deactivate = await requestJson(baseUrl, "/api/v1/users/deactivate", {
      method: "POST",
      cookie,
      headers: { "x-csrf-token": csrf! },
      body: { password: "Passw0rd!" }
    });
    assert.equal(deactivate.status, 200);
    assert.equal(deactivate.body.data.accountState, "DEACTIVATED");
    assert.ok((deactivate.headers.get("set-cookie") ?? "").includes("Max-Age=0"));

    const meAfterDeactivate = await requestJson(baseUrl, "/api/v1/auth/me", {
      cookie
    });
    assert.equal(meAfterDeactivate.status, 401);
    assert.equal(meAfterDeactivate.body.code, "AUTH_SESSION_REQUIRED");

    const relogin = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "p3@example.com", password: "Passw0rd!" }
    });
    assert.equal(relogin.status, 401);
    assert.equal(relogin.body.code, "AUTH_INVALID_CREDENTIALS");

    console.log("integration: p3 account lifecycle scenarios ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
