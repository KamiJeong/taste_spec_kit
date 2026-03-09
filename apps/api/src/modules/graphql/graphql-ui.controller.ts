import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (typeof raw !== "string" || raw.trim() === "") return fallback;
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isGraphqlUiEnabled(): boolean {
  const defaultEnabled = process.env.NODE_ENV !== "production";
  return envBool("API_GRAPHQL_UI_ENABLED", defaultEnabled);
}

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GraphQL UI Placeholder</title>
    <style>
      body { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #0f172a; color: #e2e8f0; }
      .wrap { max-width: 1080px; margin: 24px auto; padding: 0 16px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      textarea { width: 100%; min-height: 260px; border: 1px solid #334155; background: #020617; color: #e2e8f0; border-radius: 8px; padding: 12px; }
      .result { min-height: 260px; white-space: pre-wrap; background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 12px; overflow: auto; }
      .bar { display: flex; gap: 8px; margin: 12px 0; }
      button { background: #2563eb; color: white; border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
      button.alt { background: #334155; }
      input { width: 100%; border: 1px solid #334155; background: #020617; color: #e2e8f0; border-radius: 8px; padding: 8px; }
      label { display: block; margin: 8px 0 4px; font-size: 12px; color: #94a3b8; }
      .panel { border: 1px solid #334155; border-radius: 8px; padding: 12px; background: #020617; margin: 12px 0; }
      .small { font-size: 12px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h2>GraphQL UI Placeholder</h2>
      <p>Endpoint: <code>/graphql</code> | Protected by <code>Authorization: Bearer</code> auth.</p>
      <div class="panel">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>
            <label>Email</label>
            <input id="email" placeholder="you@example.com" />
          </div>
          <div>
            <label>Password</label>
            <input id="password" type="password" placeholder="password" />
          </div>
        </div>
        <div class="bar">
          <button id="login">Login</button>
          <button class="alt" id="refreshSession">Refresh Session</button>
          <button class="alt" id="autofillCsrf">Autofill CSRF</button>
          <button class="alt" id="clearBearer">Clear Bearer</button>
        </div>
      <div id="sessionStatus" class="small">Auth: unknown</div>
      </div>
      <div class="grid">
        <div>
          <label>Query</label>
          <textarea id="query"></textarea>
          <label>Variables (JSON)</label>
          <textarea id="variables"></textarea>
          <div class="bar">
            <button id="run">Run</button>
            <button class="alt" id="sampleQuery">Use Query Template</button>
            <button class="alt" id="sampleMutation">Use Mutation Template</button>
            <button class="alt" id="sampleMyChannels">Use myChannels Template</button>
            <button class="alt" id="sampleCreateChannel">Use createChannel Template</button>
          </div>
        </div>
        <div>
          <label>Optional header: Authorization</label>
          <input id="authorization" placeholder="Bearer <access-token>" />
          <label>Optional header: x-csrf-token</label>
          <input id="csrf" placeholder="csrf token value" />
          <label>Request headers (JSON)</label>
          <pre id="headersPreview" class="result"></pre>
          <label>Result</label>
          <pre id="result" class="result"></pre>
        </div>
      </div>
    </div>
    <script>
      const queryTpl = \`query ChannelPosts($channelId: String!, $limit: Int!, $cursor: String) {
  channelPosts(channelId: $channelId, limit: $limit, cursor: $cursor) {
    nextCursor
    items { id channelId authorUserId title content createdAt updatedAt }
  }
}\`;
      const queryVars = {
        channelId: "YOUR_CHANNEL_ID",
        limit: 20,
        cursor: null
      };
      const mutationTpl = \`mutation CreateChannelPost($channelId: String!, $title: String!, $content: String!) {
  createChannelPost(channelId: $channelId, title: $title, content: $content) {
    post { id channelId authorUserId title content createdAt updatedAt }
  }
}\`;
      const mutationVars = {
        channelId: "YOUR_CHANNEL_ID",
        title: "GraphQL test post",
        content: "Created from /graphql/ui"
      };
      const myChannelsTpl = \`query {
  myChannels {
    channels { id name ownerUserId role sortIndex }
  }
}\`;
      const createChannelTpl = \`mutation CreateChannel($name: String!) {
  createChannel(name: $name) { id name role }
}\`;
      const createChannelVars = { name: "GraphQL New Channel" };
      const q = document.getElementById("query");
      const v = document.getElementById("variables");
      const r = document.getElementById("result");
      const csrf = document.getElementById("csrf");
      const authorization = document.getElementById("authorization");
      const headersPreview = document.getElementById("headersPreview");
      const email = document.getElementById("email");
      const password = document.getElementById("password");
      const sessionStatus = document.getElementById("sessionStatus");
      function cookieOf(name) {
        const all = document.cookie || "";
        const parts = all.split(";").map((p) => p.trim());
        for (const part of parts) {
          const idx = part.indexOf("=");
          if (idx <= 0) continue;
          const k = part.slice(0, idx);
          const v = part.slice(idx + 1);
          if (k === name) return decodeURIComponent(v);
        }
        return "";
      }
      function autofillCsrf() {
        const value = cookieOf("csrfToken");
        if (value) csrf.value = value;
        updateHeadersPreview();
      }
      function operationType(queryText) {
        const cleaned = String(queryText || "")
          .replace(/#[^\n\r]*/g, "")
          .trimStart()
          .toLowerCase();
        if (cleaned.startsWith("mutation")) return "mutation";
        if (cleaned.startsWith("query") || cleaned.startsWith("{")) return "query";
        return "unknown";
      }
      function requestHeaders() {
        const headers = { "content-type": "application/json" };
        if (authorization.value.trim()) headers["authorization"] = authorization.value.trim();
        if (operationType(q.value) === "mutation" && csrf.value.trim()) headers["x-csrf-token"] = csrf.value.trim();
        return headers;
      }
      function updateHeadersPreview() {
        headersPreview.textContent = JSON.stringify(requestHeaders(), null, 2);
      }
      async function refreshSession() {
        const headers = {};
        if (authorization.value.trim()) headers["authorization"] = authorization.value.trim();
        const res = await fetch("/api/v1/auth/me", { credentials: "include", headers });
        const json = await res.json().catch(() => ({}));
        const hasBearer = authorization.value.trim().toLowerCase().startsWith("bearer ");
        const hasCsrf = !!cookieOf("csrfToken");
        sessionStatus.textContent = "Auth: " + (hasBearer ? "bearer=present" : "bearer=missing") +
          ", csrfToken=" + (hasCsrf ? "present" : "missing") +
          ", /auth/me status=" + res.status +
          (json?.success ? " (authenticated)" : "");
      }
      async function login() {
        const body = { email: email.value.trim(), password: password.value };
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        });
        const json = await res.json().catch(() => ({}));
        if (typeof json?.data?.accessToken === "string" && json.data.accessToken.length > 0) {
          authorization.value = "Bearer " + json.data.accessToken;
        }
        autofillCsrf();
        await refreshSession();
        r.textContent = JSON.stringify({ loginStatus: res.status, loginResponse: json }, null, 2);
      }
      function useQuery() { q.value = queryTpl; v.value = JSON.stringify(queryVars, null, 2); updateHeadersPreview(); }
      function useMutation() { q.value = mutationTpl; v.value = JSON.stringify(mutationVars, null, 2); updateHeadersPreview(); }
      function useMyChannels() { q.value = myChannelsTpl; v.value = JSON.stringify({}, null, 2); updateHeadersPreview(); }
      function useCreateChannel() { q.value = createChannelTpl; v.value = JSON.stringify(createChannelVars, null, 2); updateHeadersPreview(); }
      async function run() {
        let variables;
        try { variables = JSON.parse(v.value || "{}"); } catch (e) { r.textContent = "Invalid variables JSON"; return; }
        const headers = requestHeaders();
        const res = await fetch("/graphql", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ query: q.value, variables })
        });
        const json = await res.json();
        r.textContent = JSON.stringify(json, null, 2);
      }
      document.getElementById("run").onclick = run;
      document.getElementById("sampleQuery").onclick = useQuery;
      document.getElementById("sampleMutation").onclick = useMutation;
      document.getElementById("sampleMyChannels").onclick = useMyChannels;
      document.getElementById("sampleCreateChannel").onclick = useCreateChannel;
      document.getElementById("login").onclick = login;
      document.getElementById("refreshSession").onclick = refreshSession;
      document.getElementById("autofillCsrf").onclick = autofillCsrf;
      document.getElementById("clearBearer").onclick = () => { authorization.value = ""; };
      authorization.addEventListener("input", updateHeadersPreview);
      csrf.addEventListener("input", updateHeadersPreview);
      q.addEventListener("input", updateHeadersPreview);
      useQuery();
      autofillCsrf();
      updateHeadersPreview();
      refreshSession();
    </script>
  </body>
</html>`;

@Controller()
export class GraphqlUiController {
  @Get("/graphql/ui")
  render(@Res() res: Response) {
    if (!isGraphqlUiEnabled()) {
      return res.status(404).send("Not Found");
    }
    return res.type("html").send(HTML);
  }
}
