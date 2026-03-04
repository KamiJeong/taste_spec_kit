# taste_spec_kit

Monorepo for building and validating a spec-driven product workflow with:

- NestJS API (`apps/api`)
- Next.js web app (`apps/web`)
- Storybook + shared UI package (`apps/storybook`, `packages/ui`)
- Shared API contracts (`packages/contracts-auth`)

This repository uses **Spec Kit** as the default delivery process.

## What We Are Building

Current implemented focus:

1. Email/password auth system (signup, email verify, login, reset password, profile, session/CSRF security)
2. API documentation with Swagger (`/api/docs`, `/api-json`) and environment-based exposure control
3. Channel governance API:
   - channel create/ownership
   - join request + approve/reject flow
   - owner/manager/member role controls
   - kick/quit/ownership transfer
   - owner list reorder + personal channel reorder

Messaging/chat itself is intentionally out of scope for now; channel is currently a governance container.

## Tech Stack (SSOT)

Source of truth: [`specs/00-tech-stack.md`](./specs/00-tech-stack.md)

High-level stack:

- Node.js 22.x + TypeScript
- NestJS 11 (API)
- Next.js 15 + React 19 (Web)
- PostgreSQL + Redis
- Drizzle ORM
- Zod validation
- pnpm workspace + Turborepo

## Monorepo Structure

```txt
apps/
  api/
  web/
  storybook/
packages/
  contracts-auth/
  ui/
specs/
tooling/
```

## Quick Start

## 1) Install dependencies

```bash
pnpm install
```

## 2) Prepare local env files

```bash
pnpm run local:env
```

## 3) Start local infra (Postgres/Redis)

```bash
docker compose up -d
```

## 4) Run DB migrations

```bash
pnpm --filter @apps/api db:migrate
```

## 5) Run apps

API:

```bash
pnpm --filter @apps/api start
```

Web:

```bash
pnpm --filter @apps/web dev
```

Storybook:

```bash
pnpm --filter @repo/storybook dev
```

## API Docs

When enabled:

- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api-json`

Related env flags:

- `API_DOCS_ENABLED` (default true outside production)
- `API_DOCS_PROTECTED` (if true -> docs endpoints return 403)

## Testing

Root shortcuts:

```bash
pnpm test
pnpm run test:api
pnpm run test:integration
```

API-only:

```bash
pnpm --filter @apps/api typecheck
pnpm --filter @apps/api test
pnpm --filter @apps/api test:integration
```

## Spec Kit Workflow (Required)

Before implementation of a new feature:

1. Create branch with valid name:
   - `feature/<name>`
   - `hotfix/<name>`
   - `release/<name>`
2. Create feature docs under `specs/<id>-<feature-name>/` in this order:
   1. `spec.md`
   2. `plan.md`
   3. `tasks.md`
3. Implement only after docs exist.

Every feature doc must include:

```txt
Tech-Stack: specs/00-tech-stack.md
```

See also: [`AGENTS.md`](./AGENTS.md)

## Notes

- Do not commit real prod/stage/dev secrets.
- Use `.env.template`-based local setup.
- Prefer contract-safe and type-safe changes with test coverage.
