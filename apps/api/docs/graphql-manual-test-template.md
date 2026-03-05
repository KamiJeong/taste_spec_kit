# GraphQL Manual Test Template

Endpoint:

- `http://localhost:3000/graphql`

## 1) Query template (channel posts)

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

## 2) Mutation template (create post)

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

## 3) Header/Cookie requirements

- Query:
  - requires valid `sid` cookie (authenticated session)
- Mutation:
  - requires valid `sid` cookie
  - requires CSRF pair:
    - cookie: `csrfToken=<value>`
    - header: `x-csrf-token: <same value>`

## 4) curl example (Windows PowerShell)

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
  -H "x-csrf-token: YOUR_CSRF_TOKEN" `
  -H "cookie: sid=YOUR_SID; csrfToken=YOUR_CSRF_TOKEN" `
  --data "$body"
```

## 5) Expected failure codes (for quick sanity checks)

- no session: `AUTH_SESSION_REQUIRED`
- no membership/role: `CHANNEL_PERMISSION_DENIED`
- invalid input: `VALIDATION_ERROR`
- missing/invalid CSRF on mutation with sid: `AUTH_CSRF_INVALID`
