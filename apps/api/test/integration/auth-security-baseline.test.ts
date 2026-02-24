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
        email: "security-baseline@example.com",
        password: "Passw0rd!",
        name: "Security Baseline"
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
      body: { email: "security-baseline@example.com", password: "Passw0rd!" }
    });
    assert.equal(login.status, 200);

    const setCookie = login.headers.get("set-cookie");
    const sid = readCookie(setCookie, "sid");
    const csrf = readCookie(setCookie, "csrfToken");
    assert.ok(sid);
    assert.ok(csrf);
    const cookie = `sid=${encodeURIComponent(sid!)}; csrfToken=${encodeURIComponent(csrf!)}`;

    const patchWithoutCsrf = await requestJson(baseUrl, "/api/v1/users/profile", {
      method: "PATCH",
      cookie,
      body: { name: "No Csrf" }
    });
    assert.equal(patchWithoutCsrf.status, 403);
    assert.equal(patchWithoutCsrf.body.code, "AUTH_CSRF_INVALID");

    const patchWithCsrf = await requestJson(baseUrl, "/api/v1/users/profile", {
      method: "PATCH",
      cookie,
      headers: { "x-csrf-token": csrf! },
      body: { name: "With Csrf" }
    });
    assert.equal(patchWithCsrf.status, 200);

    const logoutWithoutCsrf = await requestJson(baseUrl, "/api/v1/auth/logout", {
      method: "POST",
      cookie
    });
    assert.equal(logoutWithoutCsrf.status, 403);
    assert.equal(logoutWithoutCsrf.body.code, "AUTH_CSRF_INVALID");

    const logoutWithCsrf = await requestJson(baseUrl, "/api/v1/auth/logout", {
      method: "POST",
      cookie,
      headers: { "x-csrf-token": csrf! }
    });
    assert.equal(logoutWithCsrf.status, 200);

    let limited: { status: number; body: any } | null = null;
    for (let i = 0; i < 12; i += 1) {
      const attempt = await requestJson(baseUrl, "/api/v1/auth/login", {
        method: "POST",
        body: { email: "ratelimit@example.com", password: "WrongPassw0rd!" }
      });
      if (attempt.status === 429) {
        limited = attempt;
        break;
      }
    }
    assert.ok(limited, "rate limit should trigger within 12 attempts");
    assert.equal(limited!.body.code, "RATE_LIMIT_EXCEEDED");

    console.log("integration: security baseline csrf and rate-limit scenarios ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
