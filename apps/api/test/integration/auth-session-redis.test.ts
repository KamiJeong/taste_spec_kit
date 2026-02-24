import assert from "node:assert/strict";
import { createClient } from "redis";
import "../load-env";
import { createApp } from "../../src/main";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

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

function sidFromSetCookie(raw: string): string {
  const first = raw.split(";")[0] ?? "";
  const [, value] = first.split("=");
  return decodeURIComponent(value ?? "");
}

function readCookie(raw: string | null, name: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(new RegExp(`${name}=([^;,\n]+)`));
  if (!match) return undefined;
  return decodeURIComponent(match[1]);
}

async function run() {
  assert.ok(process.env.REDIS_URL, "REDIS_URL is required");

  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();

  try {
    const signup = await requestJson(baseUrl, "/api/v1/auth/signup", {
      method: "POST",
      body: {
        email: "redis-session@example.com",
        password: "Passw0rd!",
        name: "Redis Session"
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
      body: { email: "redis-session@example.com", password: "Passw0rd!" }
    });
    assert.equal(login.status, 200);

    const setCookie = login.headers.get("set-cookie") ?? "";
    assert.ok(setCookie.includes("sid="));
    const sid = sidFromSetCookie(setCookie);
    const csrf = readCookie(setCookie, "csrfToken");
    const userId = login.body.data.user.id as string;
    assert.ok(csrf);
    const authCookie = `sid=${encodeURIComponent(sid)}; csrfToken=${encodeURIComponent(csrf!)}`;

    const sessionKey = `sess:${sid}`;
    const userSessionsKey = `sess:user:${userId}`;

    const savedUserId = await redis.get(sessionKey);
    assert.equal(savedUserId, userId);

    const sessionTtl = await redis.ttl(sessionKey);
    assert.ok(sessionTtl > 0, `session ttl must be positive, got ${sessionTtl}`);
    assert.ok(sessionTtl <= SESSION_TTL_SECONDS, `session ttl must be <= ${SESSION_TTL_SECONDS}, got ${sessionTtl}`);

    const userSessionTtl = await redis.ttl(userSessionsKey);
    assert.ok(userSessionTtl > 0, `user-session index ttl must be positive, got ${userSessionTtl}`);
    assert.ok(
      userSessionTtl <= SESSION_TTL_SECONDS,
      `user-session index ttl must be <= ${SESSION_TTL_SECONDS}, got ${userSessionTtl}`
    );

    const logout = await requestJson(baseUrl, "/api/v1/auth/logout", {
      method: "POST",
      cookie: authCookie,
      headers: { "x-csrf-token": csrf! }
    });
    assert.equal(logout.status, 200);

    const afterLogout = await redis.get(sessionKey);
    assert.equal(afterLogout, null);

    console.log("integration: redis session strategy and ttl scenarios ok");
  } finally {
    await redis.quit();
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
