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
        email: "invalidate-all@example.com",
        password: "Passw0rd!",
        name: "Invalidate All"
      }
    });
    assert.equal(signup.status, 201);

    const verify = await requestJson(
      baseUrl,
      `/api/v1/auth/verify-email?token=${signup.body.data.verificationToken}`
    );
    assert.equal(verify.status, 200);

    const loginA = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "invalidate-all@example.com", password: "Passw0rd!" }
    });
    const setCookieA = loginA.headers.get("set-cookie");
    const sidA = readCookie(setCookieA, "sid");
    const csrfA = readCookie(setCookieA, "csrfToken");
    assert.equal(loginA.status, 200);
    assert.ok(sidA);
    assert.ok(csrfA);
    const cookieA = `sid=${encodeURIComponent(sidA!)}; csrfToken=${encodeURIComponent(csrfA!)}`;

    const loginB = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "invalidate-all@example.com", password: "Passw0rd!" }
    });
    const setCookieB = loginB.headers.get("set-cookie");
    const sidB = readCookie(setCookieB, "sid");
    const csrfB = readCookie(setCookieB, "csrfToken");
    assert.equal(loginB.status, 200);
    assert.ok(sidB);
    assert.ok(csrfB);
    const cookieB = `sid=${encodeURIComponent(sidB!)}; csrfToken=${encodeURIComponent(csrfB!)}`;

    const meA = await requestJson(baseUrl, "/api/v1/auth/me", { cookie: cookieA });
    const meB = await requestJson(baseUrl, "/api/v1/auth/me", { cookie: cookieB });
    assert.equal(meA.status, 200);
    assert.equal(meB.status, 200);

    const deactivate = await requestJson(baseUrl, "/api/v1/users/deactivate", {
      method: "POST",
      cookie: cookieA,
      headers: { "x-csrf-token": csrfA! },
      body: { password: "Passw0rd!" }
    });
    assert.equal(deactivate.status, 200);

    const meAfterA = await requestJson(baseUrl, "/api/v1/auth/me", { cookie: cookieA });
    const meAfterB = await requestJson(baseUrl, "/api/v1/auth/me", { cookie: cookieB });
    assert.equal(meAfterA.status, 401);
    assert.equal(meAfterB.status, 401);
    assert.equal(meAfterA.body.code, "AUTH_SESSION_REQUIRED");
    assert.equal(meAfterB.body.code, "AUTH_SESSION_REQUIRED");

    console.log("integration: all sessions invalidated on deactivate ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
