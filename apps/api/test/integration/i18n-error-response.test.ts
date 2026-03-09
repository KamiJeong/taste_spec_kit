import assert from "node:assert/strict";
import "../load-env";
import { createApp } from "../../src/main";

async function run() {
  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const restEn = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { "accept-language": "en-US,en;q=0.9" }
    });
    assert.equal(restEn.status, 401);
    const restEnBody = (await restEn.json()) as { code: string; message: string };
    assert.equal(restEnBody.code, "AUTH_SESSION_REQUIRED");
    assert.equal(restEnBody.message, "Authentication is required");

    const restDefault = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.equal(restDefault.status, 401);
    const restDefaultBody = (await restDefault.json()) as { code: string; message: string };
    assert.equal(restDefaultBody.code, "AUTH_SESSION_REQUIRED");
    assert.equal(restDefaultBody.message, "Authentication is required");

    const restKo = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { "accept-language": "ko-KR,ko;q=0.9" }
    });
    assert.equal(restKo.status, 401);
    const restKoBody = (await restKo.json()) as { code: string; message: string };
    assert.equal(restKoBody.code, "AUTH_SESSION_REQUIRED");
    assert.equal(restKoBody.message, "인증이 필요합니다");

    const forgotEn = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept-language": "en-US,en;q=0.9"
      },
      body: JSON.stringify({ email: "i18n-success@example.com" })
    });
    assert.equal(forgotEn.status, 200);
    const forgotEnBody = (await forgotEn.json()) as { success: boolean; data: { message: string } };
    assert.equal(forgotEnBody.success, true);
    assert.equal(forgotEnBody.data.message, "Password reset link has been sent");

    const forgotKo = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept-language": "ko-KR,ko;q=0.9"
      },
      body: JSON.stringify({ email: "i18n-success@example.com" })
    });
    assert.equal(forgotKo.status, 200);
    const forgotKoBody = (await forgotKo.json()) as { success: boolean; data: { message: string } };
    assert.equal(forgotKoBody.success, true);
    assert.equal(forgotKoBody.data.message, "비밀번호 재설정 링크를 이메일로 발송했습니다");

    const graphqlEn = await fetch(`${baseUrl}/graphql`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept-language": "en-US,en;q=0.9"
      },
      body: JSON.stringify({ query: "query { myChannels { channels { id } } }" })
    });
    assert.equal(graphqlEn.status, 200);
    const graphqlEnBody = (await graphqlEn.json()) as {
      errors: Array<{ message: string; extensions?: { code?: string } }>;
    };
    assert.ok(Array.isArray(graphqlEnBody.errors));
    assert.equal(graphqlEnBody.errors[0]?.extensions?.code, "AUTH_SESSION_REQUIRED");
    assert.equal(graphqlEnBody.errors[0]?.message, "Authentication is required");

    console.log("integration: i18n error localization for rest/graphql ok");
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
