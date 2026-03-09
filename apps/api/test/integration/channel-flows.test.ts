import assert from "node:assert/strict";
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
  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const suffix = Date.now();
    const owner = await signupVerifyLogin(baseUrl, `channel-owner-${suffix}@example.com`);
    const managerUser = await signupVerifyLogin(baseUrl, `channel-manager-${suffix}@example.com`);
    const memberUser = await signupVerifyLogin(baseUrl, `channel-member-${suffix}@example.com`);
    const outsider = await signupVerifyLogin(baseUrl, `channel-outsider-${suffix}@example.com`);

    const create1 = await requestJson(baseUrl, "/api/v1/channels", {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true),
      body: { name: "channel-one" }
    });
    assert.equal(create1.status, 201);
    const channelOneId = create1.body.data.channel.id as string;

    const create2 = await requestJson(baseUrl, "/api/v1/channels", {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true),
      body: { name: "channel-two" }
    });
    assert.equal(create2.status, 201);
    const channelTwoId = create2.body.data.channel.id as string;

    const reorderOwned = await requestJson(baseUrl, "/api/v1/channels/reorder-owned", {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true),
      body: { channelIds: [channelTwoId, channelOneId] }
    });
    assert.equal(reorderOwned.status, 200);

    const ownerChannels = await requestJson(baseUrl, "/api/v1/channels", { headers: authHeaders(owner) });
    assert.equal(ownerChannels.status, 200);
    assert.equal(ownerChannels.body.data.channels[0].id, channelTwoId);
    assert.equal(ownerChannels.body.data.channels[1].id, channelOneId);

    const managerJoin = await requestJson(baseUrl, `/api/v1/channels/${channelOneId}/join-requests`, {
      method: "POST",
      cookie: managerUser.csrfCookie,
      headers: authHeaders(managerUser, true)
    });
    assert.equal(managerJoin.status, 201);

    const ownerApproveManagerList = await requestJson(baseUrl, `/api/v1/channels/${channelOneId}/join-requests`, { headers: authHeaders(owner) });
    assert.equal(ownerApproveManagerList.status, 200);
    const managerRequestId = ownerApproveManagerList.body.data.requests.find(
      (row: any) => row.requesterUserId === managerUser.userId
    )?.id as string;
    assert.ok(managerRequestId);

    const approveManager = await requestJson(
      baseUrl,
      `/api/v1/channels/${channelOneId}/join-requests/${managerRequestId}/approve`,
      { method: "POST", cookie: owner.csrfCookie, headers: authHeaders(owner, true) }
    );
    assert.equal(approveManager.status, 200);

    const addManager = await requestJson(baseUrl, `/api/v1/channels/${channelOneId}/managers`, {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true),
      body: { userId: managerUser.userId }
    });
    assert.equal(addManager.status, 200);

    const memberJoin = await requestJson(baseUrl, `/api/v1/channels/${channelOneId}/join-requests`, {
      method: "POST",
      cookie: memberUser.csrfCookie,
      headers: authHeaders(memberUser, true)
    });
    assert.equal(memberJoin.status, 201);

    const managerPending = await requestJson(baseUrl, `/api/v1/channels/${channelOneId}/join-requests`, { headers: authHeaders(managerUser) });
    assert.equal(managerPending.status, 200);
    const memberRequestId = managerPending.body.data.requests.find(
      (row: any) => row.requesterUserId === memberUser.userId
    )?.id as string;
    assert.ok(memberRequestId);

    const approveMember = await requestJson(
      baseUrl,
      `/api/v1/channels/${channelOneId}/join-requests/${memberRequestId}/approve`,
      { method: "POST", cookie: managerUser.csrfCookie, headers: authHeaders(managerUser, true) }
    );
    assert.equal(approveMember.status, 200);

    const outsiderJoin1 = await requestJson(baseUrl, `/api/v1/channels/${channelTwoId}/join-requests`, {
      method: "POST",
      cookie: outsider.csrfCookie,
      headers: authHeaders(outsider, true)
    });
    assert.equal(outsiderJoin1.status, 201);
    const outsiderJoin2 = await requestJson(baseUrl, `/api/v1/channels/${channelTwoId}/join-requests`, {
      method: "POST",
      cookie: outsider.csrfCookie,
      headers: authHeaders(outsider, true)
    });
    assert.equal(outsiderJoin2.status, 409);
    assert.equal(outsiderJoin2.body.code, "CHANNEL_JOIN_REQUEST_PENDING");

    const managerKickOwner = await requestJson(baseUrl, `/api/v1/channels/${channelOneId}/kick`, {
      method: "POST",
      cookie: managerUser.csrfCookie,
      headers: authHeaders(managerUser, true),
      body: { userId: owner.userId }
    });
    assert.equal(managerKickOwner.status, 403);
    assert.equal(managerKickOwner.body.code, "CHANNEL_PERMISSION_DENIED");

    const managerKickMember = await requestJson(baseUrl, `/api/v1/channels/${channelOneId}/kick`, {
      method: "POST",
      cookie: managerUser.csrfCookie,
      headers: authHeaders(managerUser, true),
      body: { userId: memberUser.userId }
    });
    assert.equal(managerKickMember.status, 200);

    const memberChannelsAfterKick = await requestJson(baseUrl, "/api/v1/channels", { headers: authHeaders(memberUser) });
    assert.equal(memberChannelsAfterKick.status, 200);
    assert.equal(
      memberChannelsAfterKick.body.data.channels.some((row: any) => row.id === channelOneId),
      false
    );

    const ownerQuitBeforeTransfer = await requestJson(baseUrl, `/api/v1/channels/${channelOneId}/quit`, {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true)
    });
    assert.equal(ownerQuitBeforeTransfer.status, 409);
    assert.equal(ownerQuitBeforeTransfer.body.code, "CHANNEL_OWNER_TRANSFER_REQUIRED");

    const transfer = await requestJson(baseUrl, `/api/v1/channels/${channelOneId}/transfer-ownership`, {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true),
      body: { targetUserId: managerUser.userId, previousOwnerRole: "manager" }
    });
    assert.equal(transfer.status, 200);

    const ownerQuitAfterTransfer = await requestJson(baseUrl, `/api/v1/channels/${channelOneId}/quit`, {
      method: "POST",
      cookie: owner.csrfCookie,
      headers: authHeaders(owner, true)
    });
    assert.equal(ownerQuitAfterTransfer.status, 200);

    const managerChannels = await requestJson(baseUrl, "/api/v1/channels", { headers: authHeaders(managerUser) });
    const managerIds = managerChannels.body.data.channels.map((row: any) => row.id) as string[];
    const reorderMine = await requestJson(baseUrl, "/api/v1/channels/reorder-my-list", {
      method: "POST",
      cookie: managerUser.csrfCookie,
      headers: authHeaders(managerUser, true),
      body: { channelIds: managerIds }
    });
    assert.equal(reorderMine.status, 200);

    console.log("integration: channel governance flows ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
