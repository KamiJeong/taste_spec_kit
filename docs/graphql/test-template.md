# GraphQL Test Template

This is the shared GraphQL test template for the monorepo.

Related docs:

- Onboarding: [`docs/graphql/README.md`](./README.md)
- Full API template: [`docs/graphql/manual-test-template.md`](./manual-test-template.md)

## Quick query

```graphql
query MyChannels {
  myChannels {
    channels {
      id
      name
      role
    }
  }
}
```

Headers:

```json
{
  "content-type": "application/json",
  "authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

## Quick mutation

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

Headers:

```json
{
  "content-type": "application/json",
  "authorization": "Bearer YOUR_ACCESS_TOKEN",
  "x-csrf-token": "YOUR_CSRF_TOKEN"
}
```

Cookie:

- `csrfToken=YOUR_CSRF_TOKEN`

## Create channel + verify flow

1. Run `CreateChannel` mutation (with CSRF header + cookie).
2. Run `MyChannels` query (Bearer only) and confirm the new channel is in the list.
