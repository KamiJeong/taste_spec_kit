import assert from "node:assert/strict";
import "../load-env";
import { createApp } from "../../src/main";

async function requestJson(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    cookie?: string;
    headers?: Record<string, string>;
  } = {}
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
  return match ? decodeURIComponent(match[1]) : undefined;
}

const FORBIDDEN_USER_SECURITY_FIELDS = [
  "passwordHash",
  "failedLoginAttempts",
  "lockedUntil",
  "deletionScheduledAt",
  "isActive"
] as const;

function assertNoForbiddenUserSecurityFields(value: unknown, path = "root"): void {
  if (value === null || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenUserSecurityFields(item, `${path}[${index}]`));
    return;
  }

  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    assert.equal(
      FORBIDDEN_USER_SECURITY_FIELDS.includes(key as (typeof FORBIDDEN_USER_SECURITY_FIELDS)[number]),
      false,
      `forbidden field "${key}" exposed at ${path}.${key}`
    );
    assertNoForbiddenUserSecurityFields(record[key], `${path}.${key}`);
  }
}

async function signupVerifyLogin(baseUrl: string, email: string) {
  const signup = await requestJson(baseUrl, "/api/v1/auth/signup", {
    method: "POST",
    body: { email, password: "Passw0rd!", name: "regression-user" }
  });
  assert.equal(signup.status, 201);

  const verify = await requestJson(baseUrl, `/api/v1/auth/verify-email?token=${signup.body.data.verificationToken}`);
  assert.equal(verify.status, 200);

  const login = await requestJson(baseUrl, "/api/v1/auth/login", {
    method: "POST",
    body: { email, password: "Passw0rd!" }
  });
  assert.equal(login.status, 200);

  const setCookie = login.headers.get("set-cookie");
  const sid = readCookie(setCookie, "sid");
  const csrf = readCookie(setCookie, "csrfToken");
  assert.ok(sid);
  assert.ok(csrf);

  return {
    cookie: `sid=${encodeURIComponent(sid!)}; csrfToken=${encodeURIComponent(csrf!)}`,
    csrfToken: csrf!
  };
}

async function run() {
  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const suffix = Date.now();
    const auth = await signupVerifyLogin(baseUrl, `channel-regression-${suffix}@example.com`);

    const meBefore = await requestJson(baseUrl, "/api/v1/auth/me", { cookie: auth.cookie });
    assert.equal(meBefore.status, 200);
    const userId = meBefore.body.data.user.id as string;

    const createChannel = await requestJson(baseUrl, "/api/v1/channels", {
      method: "POST",
      cookie: auth.cookie,
      headers: { "x-csrf-token": auth.csrfToken },
      body: { name: "regression-channel" }
    });
    assert.equal(createChannel.status, 201);

    const myChannels = await requestJson(baseUrl, "/api/v1/channels", { cookie: auth.cookie });
    assert.equal(myChannels.status, 200);
    assert.ok(myChannels.body.data.channels.length >= 1);
    assertNoForbiddenUserSecurityFields(myChannels.body.data.channels, "channels");
    const first = myChannels.body.data.channels[0];
    assert.ok(first.creator, "creator must exist");
    assert.ok(Array.isArray(first.users), "users must exist");

    const meAfterChannelOps = await requestJson(baseUrl, "/api/v1/auth/me", { cookie: auth.cookie });
    assert.equal(meAfterChannelOps.status, 200);
    assert.equal(meAfterChannelOps.body.data.user.id, userId);

    const logout = await requestJson(baseUrl, "/api/v1/auth/logout", {
      method: "POST",
      cookie: auth.cookie,
      headers: { "x-csrf-token": auth.csrfToken }
    });
    assert.equal(logout.status, 200);

    const meAfterLogout = await requestJson(baseUrl, "/api/v1/auth/me", { cookie: auth.cookie });
    assert.equal(meAfterLogout.status, 401);

    console.log("integration: channel auth regression ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
