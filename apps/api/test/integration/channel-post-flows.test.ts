import assert from "node:assert/strict";
import { Client } from "pg";
import "../load-env";
import { createApp } from "../../src/main";

type AuthCtx = { csrfCookie: string; csrfToken: string; accessToken: string; userId: string; email: string };

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
  if (!match) return undefined;
  return decodeURIComponent(match[1]);
}

async function signupVerifyLogin(baseUrl: string, email: string): Promise<AuthCtx> {
  const signup = await requestJson(baseUrl, "/api/v1/auth/signup", {
    method: "POST",
    body: { email, password: "Passw0rd!", name: email.split("@")[0] }
  });
  assert.equal(signup.status, 201);

  const verificationToken = signup.body?.data?.verificationToken as string | undefined;
  assert.ok(verificationToken, "verificationToken is required in integration test");
  const verify = await requestJson(baseUrl, `/api/v1/auth/verify-email?token=${verificationToken}`);
  assert.equal(verify.status, 200);

  const login = await requestJson(baseUrl, "/api/v1/auth/login", {
    method: "POST",
    body: { email, password: "Passw0rd!" }
  });
  assert.equal(login.status, 200);

  const accessToken = login.body?.data?.accessToken as string | undefined;
  assert.ok(accessToken);
  const setCookie = login.headers.get("set-cookie");
  const csrf = readCookie(setCookie, "csrfToken");
  assert.ok(csrf);
  const csrfCookie = `csrfToken=${encodeURIComponent(csrf!)}`;

  const me = await requestJson(baseUrl, "/api/v1/auth/me", {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  assert.equal(me.status, 200);

  return {
    csrfCookie,
    csrfToken: csrf!,
    accessToken: accessToken!,
    userId: me.body.data.user.id,
    email
  };
}

function authHeaders(auth: AuthCtx, withCsrf = false): Record<string, string> {
  return {
    authorization: `Bearer ${auth.accessToken}`,
    ...(withCsrf ? { "x-csrf-token": auth.csrfToken } : {})
  };
}

async function run() {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const suffix = Date.now();
    const owner = await signupVerifyLogin(baseUrl, `post-owner-${suffix}@example.com`);
    const managerUser = await signupVerifyLogin(baseUrl, `post-manager-${suffix}@example.com`);
    const memberUser = await signupVerifyLogin(baseUrl, `post-member-${suffix}@example.com`);
    const outsider = await signupVerifyLogin(baseUrl, `post-outsider-${suffix}@example.com`);

    const createChannel = await requestJson(baseUrl, "/api/v1/channels", {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true),
      body: { name: "post-channel" }
    });
    assert.equal(createChannel.status, 201);
    const channelId = createChannel.body.data.channel.id as string;

    const managerJoin = await requestJson(baseUrl, `/api/v1/channels/${channelId}/join-requests`, {
      method: "POST",
      cookie: managerUser.csrfCookie,
      headers: authHeaders(managerUser, true)
    });
    assert.equal(managerJoin.status, 201);
    const managerPending = await requestJson(baseUrl, `/api/v1/channels/${channelId}/join-requests`, { headers: authHeaders(owner) });
    const managerRequestId = managerPending.body.data.requests.find((row: any) => row.requesterUserId === managerUser.userId)?.id as
      | string
      | undefined;
    assert.ok(managerRequestId);
    const managerApprove = await requestJson(
      baseUrl,
      `/api/v1/channels/${channelId}/join-requests/${managerRequestId}/approve`,
      { method: "POST", cookie: owner.csrfCookie, headers: authHeaders(owner, true) }
    );
    assert.equal(managerApprove.status, 200);
    const managerGrant = await requestJson(baseUrl, `/api/v1/channels/${channelId}/managers`, {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true),
      body: { userId: managerUser.userId }
    });
    assert.equal(managerGrant.status, 200);

    const memberJoin = await requestJson(baseUrl, `/api/v1/channels/${channelId}/join-requests`, {
      method: "POST",
      cookie: memberUser.csrfCookie,
      headers: authHeaders(memberUser, true)
    });
    assert.equal(memberJoin.status, 201);
    const memberPending = await requestJson(baseUrl, `/api/v1/channels/${channelId}/join-requests`, { headers: authHeaders(owner) });
    const memberRequestId = memberPending.body.data.requests.find((row: any) => row.requesterUserId === memberUser.userId)?.id as
      | string
      | undefined;
    assert.ok(memberRequestId);
    const memberApprove = await requestJson(
      baseUrl,
      `/api/v1/channels/${channelId}/join-requests/${memberRequestId}/approve`,
      { method: "POST", cookie: owner.csrfCookie, headers: authHeaders(owner, true) }
    );
    assert.equal(memberApprove.status, 200);

    const createPost = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts`, {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true),
      body: { title: "first notice", content: "body-one" }
    });
    assert.equal(createPost.status, 201);
    const postId = createPost.body.data.post.id as string;
    const postUpdatedAt = createPost.body.data.post.updatedAt as string;

    const memberList = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts`, {
      headers: authHeaders(memberUser)
    });
    assert.equal(memberList.status, 200);
    assert.equal(memberList.body.data.items.length, 1);

    const outsiderList = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts`, {
      headers: authHeaders(outsider)
    });
    assert.equal(outsiderList.status, 403);
    assert.equal(outsiderList.body.code, "CHANNEL_PERMISSION_DENIED");

    const memberCreateDenied = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts`, {
      method: "POST",
      cookie: memberUser.csrfCookie,
      headers: authHeaders(memberUser, true),
      body: { title: "try", content: "try" }
    });
    assert.equal(memberCreateDenied.status, 403);

    const managerConflict = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts/${postId}`, {
      method: "PATCH",
      cookie: managerUser.csrfCookie,
      headers: authHeaders(managerUser, true),
      body: { content: "manager update", ifUpdatedAt: "1970-01-01T00:00:00.000Z" }
    });
    assert.equal(managerConflict.status, 409);
    assert.equal(managerConflict.body.code, "CHANNEL_POST_VERSION_CONFLICT");

    const managerUpdate = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts/${postId}`, {
      method: "PATCH",
      cookie: managerUser.csrfCookie,
      headers: authHeaders(managerUser, true),
      body: { content: "manager update", ifUpdatedAt: postUpdatedAt }
    });
    assert.equal(managerUpdate.status, 200);
    assert.equal(managerUpdate.body.data.post.content, "manager update");

    const createPost2 = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts`, {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true),
      body: { title: "second notice", content: "body-two" }
    });
    assert.equal(createPost2.status, 201);

    const createPost3 = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts`, {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true),
      body: { title: "third notice", content: "body-three" }
    });
    assert.equal(createPost3.status, 201);

    const page1 = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts?limit=2`, { headers: authHeaders(memberUser) });
    assert.equal(page1.status, 200);
    assert.equal(page1.body.data.items.length, 2);
    assert.ok(page1.body.data.nextCursor);

    const page2 = await requestJson(
      baseUrl,
      `/api/v1/channels/${channelId}/posts?limit=2&cursor=${encodeURIComponent(page1.body.data.nextCursor)}`,
      { headers: authHeaders(memberUser) }
    );
    assert.equal(page2.status, 200);
    assert.ok(page2.body.data.items.length >= 1);

    const managerDelete = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts/${postId}`, {
      method: "DELETE",
      cookie: managerUser.csrfCookie,
      headers: authHeaders(managerUser, true)
    });
    assert.equal(managerDelete.status, 200);

    const deletedDetail = await requestJson(baseUrl, `/api/v1/channels/${channelId}/posts/${postId}`, {
      headers: authHeaders(owner)
    });
    assert.equal(deletedDetail.status, 404);
    assert.equal(deletedDetail.body.code, "CHANNEL_POST_NOT_FOUND");

    const auditRows = (
      await db.query(
        `
          SELECT event_type
          FROM audit_logs
          WHERE email in ($1, $2)
            AND event_type IN ('CHANNEL_POST_CREATE', 'CHANNEL_POST_UPDATE', 'CHANNEL_POST_DELETE')
        `,
        [owner.email, managerUser.email]
      )
    ).rows;
    const events = new Set(auditRows.map((row) => String(row.event_type)));
    assert.ok(events.has("CHANNEL_POST_CREATE"));
    assert.ok(events.has("CHANNEL_POST_UPDATE"));
    assert.ok(events.has("CHANNEL_POST_DELETE"));

    console.log("integration: channel post flows ok");
  } finally {
    await db.end();
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
