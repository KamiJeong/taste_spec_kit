# taste_spec_kit

Monorepo for building and validating a spec-driven product workflow with:

- NestJS API (`apps/api`)
- Next.js web app (`apps/web`)
- Storybook + shared UI package (`apps/storybook`, `packages/ui`)
- Shared API contracts (`packages/contracts-auth`)

This repository uses **Spec Kit** as the default delivery process.

## Spec Kit Delivery Progress

Current delivery visibility (spec folders `01` to `12`):

| Spec ID | Feature | Status | Last Update | Link |
| --- | --- | --- | --- | --- |
| 01 | Design System Foundation + shadcn/ui Ownership | Implemented | 2026-02-24 | `specs/01-design-system/` |
| 02 | Email Auth Backend | Implemented | 2026-02-23 | `specs/02-email-auth-backend/` |
| 03 | Email Auth Frontend | Implemented | 2026-02-23 | `specs/03-email-auth-frontend/` |
| 04 | Codex Issue Autoflow | Implemented | 2026-02-26 | `specs/04-codex-issue-autoflow/` |
| 05 | Codex Telegram Issue Notify | Implemented | 2026-02-27 | `specs/05-codex-telegram-issue-notify/` |
| 06 | Codex Health Check | Implemented | 2026-02-28 | `specs/06-codex-health-check/` |
| 07 | API Docs Swagger | Implemented | 2026-03-01 | `specs/07-api-docs-swagger/` |
| 08 | Channel Governance | Implemented | 2026-03-03 | `specs/08-channel-governance/` |
| 09 | Channel Posts | Implemented | 2026-03-04 | `specs/09-channel-posts/` |
| 10 | GitHub Coverage Reporting | Implemented | 2026-03-05 | `specs/10-github-coverage-reporting/` |
| 11 | README Spec Kit Progress/History | Implemented | 2026-03-05 | `specs/11-readme-spec-kit-progress-history/` |
| 12 | GraphQL API Foundation | In Progress | 2026-03-05 | `specs/12-graphql-api-foundation/` |

Spec Kit + Codex baseline:
- Spec-first delivery (`spec -> plan -> tasks -> implementation`) is now the repository default.
- Recent CI improvements include required-check stability, GitHub coverage summary/artifacts, and Telegram coverage notifications.

## Spec History

Date-based entries:

- 2026-02-23: [`specs/history/2026-02-23.md`](./specs/history/2026-02-23.md)
- 2026-03-05: [`specs/history/2026-03-05.md`](./specs/history/2026-03-05.md)

Rule:
- For every merged feature, add one dated entry under `specs/history/` and update this section link list.

## README Update Policy (Mandatory)

When a new feature branch is merged, update `README.md` in the same PR (or immediately after merge) with this checklist:

1. Update `Spec Kit Delivery Progress`:
   - Add new spec row (next ID)
   - Set status and last update date (`YYYY-MM-DD`)
   - Add spec folder link
2. Update `Spec History`:
   - Add a dated link entry under `specs/history/`
3. Keep sections concise:
   - README = overview and links
   - Detailed logs stay in `specs/<id>-*/` or `specs/history/*.md`
4. Sync rule:
   - No feature is considered fully done until README progress/history is updated.

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

GraphQL manual test template:

- [`apps/api/docs/graphql-manual-test-template.md`](./apps/api/docs/graphql-manual-test-template.md)
- Local UI placeholder page: `http://localhost:3000/graphql/ui` (non-production default)

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
