import assert from "node:assert/strict";
import "../load-env";
import { createApp } from "../../src/main";
import { PersistenceService } from "../../src/modules/persistence/persistence.service";

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
        email: "lock@example.com",
        password: "Passw0rd!",
        name: "Lock User"
      }
    });
    assert.equal(signup.status, 201);

    const verify = await requestJson(
      baseUrl,
      `/api/v1/auth/verify-email?token=${signup.body.data.verificationToken}`
    );
    assert.equal(verify.status, 200);

    for (let i = 0; i < 5; i += 1) {
      const fail = await requestJson(baseUrl, "/api/v1/auth/login", {
        method: "POST",
        body: { email: "lock@example.com", password: "WrongPassw0rd!" }
      });
      assert.equal(fail.status, 401);
      assert.equal(fail.body.code, "AUTH_INVALID_CREDENTIALS");
    }

    const locked = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "lock@example.com", password: "Passw0rd!" }
    });
    assert.equal(locked.status, 401);
    assert.equal(locked.body.code, "AUTH_INVALID_CREDENTIALS");

    const persistence = app.get(PersistenceService);
    const user = await persistence.findUserByEmail("lock@example.com");
    assert.ok(user);
    user.lockedUntil = Date.now() - 1;
    await persistence.updateUser(user);

    const unlocked = await requestJson(baseUrl, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "lock@example.com", password: "Passw0rd!" }
    });
    assert.equal(unlocked.status, 200);

    console.log("integration: lockout scenarios ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
