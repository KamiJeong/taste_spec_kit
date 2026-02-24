import assert from "node:assert/strict";
import "../load-env";
import { createApp } from "../../src/main";
import { AuthService } from "../../src/modules/auth/auth.service";

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
        email: "p2@example.com",
        password: "Passw0rd!",
        name: "P2 User"
      }
    });
    const verify = await requestJson(
      baseUrl,
      `/api/v1/auth/verify-email?token=${signup.body.data.verificationToken}`
    );
    assert.equal(verify.status, 200);

    const forgot = await requestJson(baseUrl, "/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "p2@example.com" }
    });
    assert.equal(forgot.status, 200);
    const token = forgot.body.data.resetToken as string;

    const authService = app.get(AuthService);
    await authService.expireResetTokenForTest(token);

    const expiredReset = await requestJson(baseUrl, "/api/v1/auth/reset-password", {
      method: "POST",
      body: { token, newPassword: "NewPassw0rd!" }
    });
    assert.equal(expiredReset.status, 400);
    assert.equal(expiredReset.body.code, "AUTH_TOKEN_EXPIRED");

    const forgot2 = await requestJson(baseUrl, "/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "p2@example.com" }
    });
    const token2 = forgot2.body.data.resetToken as string;

    const reset = await requestJson(baseUrl, "/api/v1/auth/reset-password", {
      method: "POST",
      body: { token: token2, newPassword: "NewPassw0rd!" }
    });
    assert.equal(reset.status, 200);

    const reuseReset = await requestJson(baseUrl, "/api/v1/auth/reset-password", {
      method: "POST",
      body: { token: token2, newPassword: "AnotherPassw0rd!" }
    });
    assert.equal(reuseReset.status, 400);
    assert.equal(reuseReset.body.code, "AUTH_TOKEN_INVALID");

    const login = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "p2@example.com", password: "NewPassw0rd!" }
    });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get("set-cookie");
    const sid = readCookie(setCookie, "sid");
    const csrf = readCookie(setCookie, "csrfToken");
    assert.ok(sid);
    assert.ok(csrf);
    const cookie = `sid=${encodeURIComponent(sid!)}; csrfToken=${encodeURIComponent(csrf!)}`;

    const profile = await requestJson(baseUrl, "/api/v1/users/profile", {
      method: "GET",
      cookie
    });
    assert.equal(profile.status, 200);
    assert.equal(profile.body.data.profile.email, "p2@example.com");

    const patch = await requestJson(baseUrl, "/api/v1/users/profile", {
      method: "PATCH",
      cookie,
      headers: { "x-csrf-token": csrf! },
      body: { name: "Updated User" }
    });
    assert.equal(patch.status, 200);
    assert.equal(patch.body.data.profile.name, "Updated User");

    const changePassword = await requestJson(baseUrl, "/api/v1/users/change-password", {
      method: "POST",
      cookie,
      headers: { "x-csrf-token": csrf! },
      body: {
        currentPassword: "NewPassw0rd!",
        newPassword: "ThirdPassw0rd!"
      }
    });
    assert.equal(changePassword.status, 200);

    const relogin = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "p2@example.com", password: "ThirdPassw0rd!" }
    });
    assert.equal(relogin.status, 200);

    console.log("integration: p2 auth/profile scenarios ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
