import assert from "node:assert/strict";
import { Client } from "pg";
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
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");

  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  try {
    const signup = await requestJson(baseUrl, "/api/v1/auth/signup", {
      method: "POST",
      body: {
        email: "audit@example.com",
        password: "Passw0rd!",
        name: "Audit User"
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
      body: { email: "audit@example.com", password: "Passw0rd!" }
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie") ?? "";

    const forgot = await requestJson(baseUrl, "/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "audit@example.com" }
    });
    assert.equal(forgot.status, 200);

    const reset = await requestJson(baseUrl, "/api/v1/auth/reset-password", {
      method: "POST",
      body: { token: forgot.body.data.resetToken, newPassword: "NewPassw0rd!" }
    });
    assert.equal(reset.status, 200);

    const relogin = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "audit@example.com", password: "NewPassw0rd!" }
    });
    assert.equal(relogin.status, 200);
    const reloginSetCookie = relogin.headers.get("set-cookie");
    const reloginSid = readCookie(reloginSetCookie, "sid");
    const reloginCsrf = readCookie(reloginSetCookie, "csrfToken");
    assert.ok(reloginSid);
    assert.ok(reloginCsrf);
    const reloginCookie = `sid=${encodeURIComponent(reloginSid!)}; csrfToken=${encodeURIComponent(reloginCsrf!)}`;

    const logout = await requestJson(baseUrl, "/api/v1/auth/logout", {
      method: "POST",
      cookie: reloginCookie,
      headers: { "x-csrf-token": reloginCsrf! }
    });
    assert.equal(logout.status, 200);

    const relogin2 = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "audit@example.com", password: "NewPassw0rd!" }
    });
    assert.equal(relogin2.status, 200);
    const reloginSetCookie2 = relogin2.headers.get("set-cookie");
    const reloginSid2 = readCookie(reloginSetCookie2, "sid");
    const reloginCsrf2 = readCookie(reloginSetCookie2, "csrfToken");
    assert.ok(reloginSid2);
    assert.ok(reloginCsrf2);
    const reloginCookie2 = `sid=${encodeURIComponent(reloginSid2!)}; csrfToken=${encodeURIComponent(reloginCsrf2!)}`;

    const deactivate = await requestJson(baseUrl, "/api/v1/users/deactivate", {
      method: "POST",
      cookie: reloginCookie2,
      headers: { "x-csrf-token": reloginCsrf2! },
      body: { password: "NewPassw0rd!" }
    });
    assert.equal(deactivate.status, 200);

    const rows = (
      await db.query(
        `
          SELECT event_id, event_type, user_id, email, ip, user_agent, result, reason_code, occurred_at
          FROM audit_logs
          WHERE email = $1
          ORDER BY occurred_at ASC
        `,
        ["audit@example.com"]
      )
    ).rows as Array<Record<string, unknown>>;

    const types = new Set(rows.map((row) => String(row.event_type)));
    for (const requiredType of [
      "AUTH_SIGNUP",
      "AUTH_VERIFY_EMAIL",
      "AUTH_LOGIN",
      "AUTH_LOGOUT",
      "AUTH_RESET_PASSWORD",
      "USER_DEACTIVATE"
    ]) {
      assert.ok(types.has(requiredType), `missing audit event type: ${requiredType}`);
    }

    for (const row of rows) {
      assert.ok(row.event_id);
      assert.ok(row.event_type);
      assert.ok(row.ip);
      assert.ok(row.user_agent);
      assert.ok(row.result);
      assert.ok(row.occurred_at);
    }

    console.log("integration: auth audit-log scenarios ok");
  } finally {
    await db.end();
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
