# GraphQL Manual Test Template

Endpoint:

- `http://localhost:3000/graphql`

## AuthGuard (REST + GraphQL)

- Protected endpoints use shared `AuthGuard`.
- Authentication source:
  - `Authorization: Bearer <access-token>`
- If neither is valid, response/error code is `AUTH_SESSION_REQUIRED`.
- CSRF is required for all state-changing requests by policy:
  - `csrfToken` cookie must match `x-csrf-token` header
  - applies to bearer-auth mutations

## 1) Working query template (myChannels)

```graphql
query MyChannels {
  myChannels {
    channels {
      id
      name
      ownerUserId
      role
      sortIndex
      creator {
        id
        email
        name
      }
      users {
        role
        joinedAt
        updatedAt
        user {
          id
          email
          name
        }
      }
    }
  }
}
```

Variables:

```json
{}
```

## 2) Working mutation template (createChannel)

```graphql
mutation CreateChannel($name: String!) {
  createChannel(name: $name) {
    id
    name
    role
  }
}
```

Variables:

```json
{
  "name": "GraphQL New Channel"
}
```

### 2.1) Create channel request body example

```json
{
  "query": "mutation CreateChannel($name: String!) { createChannel(name: $name) { id name role } }",
  "variables": {
    "name": "GraphQL New Channel"
  }
}
```

### 2.2) Verify created channel with query

After running `createChannel`, call `myChannels` and check the new channel name appears in `data.myChannels.channels`.

## 3) Query template (channel posts)

```graphql
query ChannelPosts($channelId: String!, $limit: Int!, $cursor: String) {
  channelPosts(channelId: $channelId, limit: $limit, cursor: $cursor) {
    nextCursor
    items {
      id
      channelId
      authorUserId
      title
      content
      createdAt
      updatedAt
    }
  }
}
```

Variables:

```json
{
  "channelId": "YOUR_CHANNEL_ID",
  "limit": 20,
  "cursor": null
}
```

## 4) Mutation template (create post)

```graphql
mutation CreateChannelPost($channelId: String!, $title: String!, $content: String!) {
  createChannelPost(channelId: $channelId, title: $title, content: $content) {
    post {
      id
      channelId
      authorUserId
      title
      content
      createdAt
      updatedAt
    }
  }
}
```

Variables:

```json
{
  "channelId": "YOUR_CHANNEL_ID",
  "title": "GraphQL test post",
  "content": "Created from GraphQL manual template"
}
```

## 5) Header/Cookie requirements

- Query:
  - requires `Authorization: Bearer <access-token>`
  - `x-csrf-token` is optional
- Mutation:
  - requires CSRF pair:
    - cookie: `csrfToken=<value>`
    - header: `x-csrf-token: <same value>`
  - applies even when using bearer auth

Query header JSON example:

```json
{
  "content-type": "application/json",
  "authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

Mutation header JSON example:

```json
{
  "content-type": "application/json",
  "authorization": "Bearer YOUR_ACCESS_TOKEN",
  "x-csrf-token": "YOUR_CSRF_TOKEN"
}
```

## 6) curl examples (Windows PowerShell)

`myChannels` query:

```powershell
$body = @{
  query = @"
query MyChannels {
  myChannels {
    channels { id name ownerUserId role sortIndex }
  }
}
"@
  variables = @{}
} | ConvertTo-Json -Depth 10

curl.exe -X POST "http://localhost:3000/graphql" `
  -H "content-type: application/json" `
  -H "authorization: Bearer YOUR_ACCESS_TOKEN" `
  --data "$body"
```

`createChannel` mutation:

```powershell
$body = @{
  query = @"
mutation CreateChannel($name: String!) {
  createChannel(name: $name) { id name role }
}
"@
  variables = @{
    name = "GraphQL New Channel"
  }
} | ConvertTo-Json -Depth 10

curl.exe -X POST "http://localhost:3000/graphql" `
  -H "content-type: application/json" `
  -H "authorization: Bearer YOUR_ACCESS_TOKEN" `
  -H "x-csrf-token: YOUR_CSRF_TOKEN" `
  -H "cookie: csrfToken=YOUR_CSRF_TOKEN" `
  --data "$body"
```

`createChannelPost` mutation:

```powershell
$body = @{
  query = @"
mutation CreateChannelPost($channelId: String!, $title: String!, $content: String!) {
  createChannelPost(channelId: $channelId, title: $title, content: $content) {
    post { id title createdAt }
  }
}
"@
  variables = @{
    channelId = "YOUR_CHANNEL_ID"
    title = "GraphQL test post"
    content = "Created from PowerShell"
  }
} | ConvertTo-Json -Depth 10

curl.exe -X POST "http://localhost:3000/graphql" `
  -H "content-type: application/json" `
  -H "authorization: Bearer YOUR_ACCESS_TOKEN" `
  -H "x-csrf-token: YOUR_CSRF_TOKEN" `
  -H "cookie: csrfToken=YOUR_CSRF_TOKEN" `
  --data "$body"
```

Query bearer example:

```powershell
curl.exe -X POST "http://localhost:3000/graphql" `
  -H "content-type: application/json" `
  -H "authorization: Bearer YOUR_ACCESS_TOKEN" `
  --data "$body"
```

## 7) Expected failure codes (for quick sanity checks)

- no session: `AUTH_SESSION_REQUIRED`
- no membership/role: `CHANNEL_PERMISSION_DENIED`
- invalid input: `VALIDATION_ERROR`
- missing/invalid CSRF on mutation: `AUTH_CSRF_INVALID`
