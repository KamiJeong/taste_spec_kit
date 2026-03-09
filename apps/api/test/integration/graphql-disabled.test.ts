import assert from "node:assert/strict";
import "../load-env";

async function run() {
  const previous = process.env.API_GRAPHQL_ENABLED;
  process.env.API_GRAPHQL_ENABLED = "false";
  const { createApp } = await import("../../src/main");

  const app = await createApp();
  await app.listen(0);
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const graphql = await fetch(`${baseUrl}/graphql`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" })
    });
    assert.equal(graphql.status, 404);

    const graphqlUi = await fetch(`${baseUrl}/graphql/ui`);
    assert.equal(graphqlUi.status, 404);

    console.log("integration: graphql disabled switch hides graphql routes");
  } finally {
    await app.close();
    if (previous === undefined) {
      delete process.env.API_GRAPHQL_ENABLED;
    } else {
      process.env.API_GRAPHQL_ENABLED = previous;
    }
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
