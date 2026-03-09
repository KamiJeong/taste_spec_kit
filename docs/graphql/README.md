# GraphQL Onboarding Guide

This guide is for new users who need to test GraphQL quickly in local.

## Endpoints

- GraphQL API: `http://localhost:3000/graphql`
- GraphQL UI (local helper): `http://localhost:3000/graphql/ui`

## Required auth and CSRF policy

- All protected GraphQL operations require:
  - `Authorization: Bearer <access-token>`
- CSRF policy:
  - `query`: `x-csrf-token` optional
  - `mutation`: `x-csrf-token` required and must match `csrfToken` cookie

## Quick start flow

1. Login via REST (`/api/v1/auth/login`) and copy access token from response.
2. Open `/graphql/ui`.
3. Paste `Bearer <access-token>` into `Authorization`.
4. Run `myChannels` query first.
5. For mutations, set CSRF token (UI supports autofill from cookie).

## Test templates

- Shared quick template:
  - [`docs/graphql/test-template.md`](./test-template.md)
- Main template doc:
  - [`docs/graphql/manual-test-template.md`](./manual-test-template.md)

Includes:
- `myChannels` query
- `createChannel` mutation
- `channelPosts` query
- `createChannelPost` mutation
- Header JSON examples
- PowerShell `curl` examples
- Common error codes

## Troubleshooting

- `AUTH_SESSION_REQUIRED`
  - Check `Authorization` header format and token expiration.
- `AUTH_CSRF_INVALID`
  - For mutation, verify `x-csrf-token` equals `csrfToken` cookie value.
- Query works only with CSRF header in your tool
  - Usually header JSON parsing issue (for example trailing comma) or missing Authorization send.
