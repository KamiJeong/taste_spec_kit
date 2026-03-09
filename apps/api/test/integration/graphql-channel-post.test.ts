import assert from "node:assert/strict";
import "../load-env";
import { ERROR_CODES } from "@packages/contracts-auth";
import { createApp } from "../../src/main";

const FORBIDDEN_USER_SECURITY_FIELDS = [
  "passwordHash",
  "failedLoginAttempts",
  "lockedUntil",
  "deletionScheduledAt",
  "isActive"
] as const;

function readCookie(raw: string | null, name: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(new RegExp(`${name}=([^;,\n]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

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

async function run() {
  process.env.ALLOW_INMEMORY_FALLBACK = "true";
  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;
  let authToken: string | undefined;
  let csrfTokenForMutation: string | undefined;

  try {
    {
      const response = await fetch(`${baseUrl}/graphql`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: `
            query {
              myChannels {
                channels {
                  id
                  name
                  role
                  creator { id email name }
                  users { role user { id email name } }
                }
              }
            }
          `
        })
      });
      const json = (await response.json()) as any;
      assert.equal(response.status, 200);
      assert.equal(json.errors?.[0]?.extensions?.code, ERROR_CODES.AUTH_SESSION_REQUIRED);
    }

    {
      const suffix = Date.now();
      const email = `graphql-channel-${suffix}@example.com`;

      const signup = await fetch(`${baseUrl}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "Passw0rd!", name: "graphql-user" })
      });
      const signupJson = (await signup.json()) as any;
      assert.equal(signup.status, 201);

      const verify = await fetch(
        `${baseUrl}/api/v1/auth/verify-email?token=${encodeURIComponent(signupJson.data.verificationToken)}`
      );
      assert.equal(verify.status, 200);

      const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "Passw0rd!" })
      });
      assert.equal(login.status, 200);
      const loginJson = (await login.json()) as any;
      const accessToken = loginJson?.data?.accessToken as string | undefined;
      assert.ok(typeof accessToken === "string" && accessToken.length > 0);
      authToken = accessToken;

      const setCookie = login.headers.get("set-cookie");
      const csrfToken = readCookie(setCookie, "csrfToken");
      assert.ok(csrfToken);
      csrfTokenForMutation = csrfToken;
      const csrfCookie = `csrfToken=${encodeURIComponent(csrfToken!)}`;

      const createChannel = await fetch(`${baseUrl}/api/v1/channels`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          cookie: csrfCookie,
          "x-csrf-token": csrfToken!
        },
        body: JSON.stringify({ name: "graphql-channel-safe-view" })
      });
      assert.equal(createChannel.status, 201);

      const myChannels = await fetch(`${baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          query: `
            query {
              myChannels {
                channels {
                  id
                  name
                  ownerUserId
                  role
                  creator { id email name }
                  users { role joinedAt updatedAt user { id email name } }
                }
              }
            }
          `
        })
      });
      const myChannelsJson = (await myChannels.json()) as any;
      assert.equal(myChannels.status, 200);
      const channels = myChannelsJson.data?.myChannels?.channels ?? [];
      assert.ok(Array.isArray(channels));
      assert.ok(channels.length >= 1);
      assertNoForbiddenUserSecurityFields(channels, "graphql.myChannels.channels");

      const myChannelsBearer = await fetch(`${baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          query: `
            query {
              myChannels {
                channels { id name role }
              }
            }
          `
        })
      });
      const myChannelsBearerJson = (await myChannelsBearer.json()) as any;
      assert.equal(myChannelsBearer.status, 200);
      const bearerChannels = myChannelsBearerJson.data?.myChannels?.channels ?? [];
      assert.ok(Array.isArray(bearerChannels));
      assert.ok(bearerChannels.length >= 1);

      const createChannelBearer = await fetch(`${baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          cookie: csrfCookie,
          "x-csrf-token": csrfToken!
        },
        body: JSON.stringify({
          query: `
            mutation CreateChannel($name: String!) {
              createChannel(name: $name) { id name role }
            }
          `,
          variables: { name: "graphql-bearer-channel" }
        })
      });
      const createChannelBearerJson = (await createChannelBearer.json()) as any;
      assert.equal(createChannelBearer.status, 200);
      assert.equal(typeof createChannelBearerJson.data?.createChannel?.id, "string");
    }

    {
      const response = await fetch(`${baseUrl}/graphql`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: `
            query {
              myChannels {
                channels {
                  users {
                    user {
                      passwordHash
                    }
                  }
                }
              }
            }
          `
        })
      });
      const json = (await response.json()) as any;
      assert.equal(response.status, 400);
      assert.match(
        String(json.errors?.[0]?.message ?? ""),
        /Cannot query field "passwordHash"/
      );
    }

    {
      assert.ok(authToken);
      assert.ok(csrfTokenForMutation);
      const response = await fetch(`${baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${authToken}`,
          cookie: `csrfToken=${encodeURIComponent(csrfTokenForMutation)}`,
          "x-csrf-token": csrfTokenForMutation
        },
        body: JSON.stringify({
          query: `
            mutation CreateChannel($name: String!) {
              createChannel(name: $name) { id name role }
            }
          `,
          variables: { name: "" }
        })
      });
      const json = (await response.json()) as any;
      assert.equal(response.status, 200);
      assert.equal(json.errors?.[0]?.extensions?.code, ERROR_CODES.VALIDATION_ERROR);
    }

    {
      assert.ok(authToken);
      const response = await fetch(`${baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query: `
            query ChannelPosts($channelId: String!, $limit: Int!) {
              channelPosts(channelId: $channelId, limit: $limit) {
                nextCursor
                items { id }
              }
            }
          `,
          variables: { channelId: "dummy-channel-id", limit: 999 }
        })
      });
      const json = (await response.json()) as any;
      assert.equal(response.status, 200);
      assert.equal(json.errors?.[0]?.extensions?.code, ERROR_CODES.VALIDATION_ERROR);
    }

    {
      const response = await fetch(`${baseUrl}/graphql`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation CreatePost($channelId: String!, $title: String!, $content: String!) {
              createChannelPost(channelId: $channelId, title: $title, content: $content) {
                post { id }
              }
            }
          `,
          variables: {
            channelId: "dummy-channel-id",
            title: "hello",
            content: "world"
          }
        })
      });
      const json = (await response.json()) as any;
      assert.equal(response.status, 200);
      assert.equal(json.errors?.[0]?.extensions?.code, ERROR_CODES.AUTH_SESSION_REQUIRED);
    }

    console.log("integration: graphql channel and channel-post auth/validation scenarios ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
