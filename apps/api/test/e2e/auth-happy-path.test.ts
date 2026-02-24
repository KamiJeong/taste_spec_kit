import assert from "node:assert/strict";
import "../load-env";
import { createApp } from "../../src/main";

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
  const email = `e2e-happy-${Date.now().toString(36)}@example.com`;

  try {
    const signup = await requestJson(baseUrl, "/api/v1/auth/signup", {
      method: "POST",
      body: {
        email,
        password: "Passw0rd!",
        name: "E2E Happy"
      }
    });
    assert.equal(signup.status, 201);
    assert.ok(signup.body.data.verificationToken);

    const verify = await requestJson(
      baseUrl,
      `/api/v1/auth/verify-email?token=${signup.body.data.verificationToken}`
    );
    assert.equal(verify.status, 200);

    const login = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email, password: "Passw0rd!" }
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie") ?? undefined;
    assert.ok(cookie?.includes("sid="));

    const me = await requestJson(baseUrl, "/api/v1/auth/me", { cookie });
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, email);

    console.log("e2e: auth happy-path ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
