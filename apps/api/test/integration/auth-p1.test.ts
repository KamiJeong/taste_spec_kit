import assert from "node:assert/strict";
import "../load-env";
import { createApp } from "../../src/main";
import { AuthService } from "../../src/modules/auth/auth.service";

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
        email: "user@example.com",
        password: "Passw0rd!",
        name: "User"
      }
    });
    assert.equal(signup.status, 201);
    assert.equal(signup.body.success, true);
    assert.ok(signup.body.data.verificationToken);
    assert.ok(signup.headers.get("x-request-id"));

    const duplicate = await requestJson(baseUrl, "/api/v1/auth/signup", {
      method: "POST",
      body: {
        email: "user@example.com",
        password: "Passw0rd!",
        name: "User"
      }
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.code, "USER_EMAIL_ALREADY_EXISTS");

    const unverifiedLogin = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "user@example.com",
        password: "Passw0rd!"
      }
    });
    assert.equal(unverifiedLogin.status, 401);
    assert.equal(unverifiedLogin.body.code, "AUTH_INVALID_CREDENTIALS");

    const authService = app.get(AuthService);
    await authService.expireVerificationTokenForTest(signup.body.data.verificationToken);
    const verifyExpired = await requestJson(
      baseUrl,
      `/api/v1/auth/verify-email?token=${signup.body.data.verificationToken}`
    );
    assert.equal(verifyExpired.status, 400);
    assert.equal(verifyExpired.body.code, "AUTH_TOKEN_EXPIRED");

    const resend = await requestJson(baseUrl, "/api/v1/auth/resend-verification", {
      method: "POST",
      body: { email: "user@example.com" }
    });
    assert.equal(resend.status, 200);
    assert.ok(resend.body.data.verificationToken);

    const verifyToken = resend.body.data.verificationToken;
    const verify = await requestJson(baseUrl, `/api/v1/auth/verify-email?token=${verifyToken}`);
    assert.equal(verify.status, 200);
    assert.equal(verify.body.success, true);

    const relogin = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "user@example.com",
        password: "Passw0rd!"
      }
    });
    assert.equal(relogin.status, 200);
    const cookie = relogin.headers.get("set-cookie");
    assert.ok(cookie?.includes("sid="));

    const me = await requestJson(baseUrl, "/api/v1/auth/me", {
      cookie: cookie ?? undefined
    });
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, "user@example.com");

    console.log("integration: p1 auth scenarios ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
