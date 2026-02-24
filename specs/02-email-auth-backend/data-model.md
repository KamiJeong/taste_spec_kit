# Data Model Guide (Drizzle/PostgreSQL)

## Purpose

This document is the team-facing reference for backend auth data.
It is written for sharing with backend, frontend, QA, and PM.

Source of truth in code:
- `apps/api/src/modules/persistence/schema.ts`

Diagram:
- `specs/02-email-auth-backend/erd.mmd`

## Core Entities

### `users`

User account state and authentication base data.

Key columns:
- `id` (PK, text)
- `email` (unique, not null)
- `password_hash` (not null)
- `name` (nullable)
- `email_verified` (boolean, default `false`)
- `is_active` (boolean, default `true`)
- `failed_login_attempts` (int, default `0`)
- `locked_until` (nullable, epoch ms)
- `deletion_scheduled_at` (nullable, ISO datetime text)
- `created_at` (ISO datetime text)

### `verification_tokens`

Email verification one-time token records (hashed token only).

Key columns:
- `token_hash` (PK, text)
- `user_id` (logical FK -> `users.id`)
- `expires_at` (epoch ms)
- `used_at` (nullable, epoch ms)

### `password_reset_tokens`

Password reset one-time token records (hashed token only).

Key columns:
- `token_hash` (PK, text)
- `user_id` (logical FK -> `users.id`)
- `expires_at` (epoch ms)
- `used_at` (nullable, epoch ms)

### `audit_logs`

Security/audit event history for auth and user-account events.

Key columns:
- `event_id` (PK, text)
- `event_type` (not null)
- `user_id` (nullable)
- `email` (nullable)
- `ip` (not null)
- `user_agent` (not null)
- `result` (not null)
- `reason_code` (nullable)
- `occurred_at` (ISO datetime text)

## Relations (Logical)

Current schema uses logical relations in service layer:
- `users (1) -> (N) verification_tokens`
- `users (1) -> (N) password_reset_tokens`
- `users (1) -> (N) audit_logs`

Note:
- These links are tracked by `user_id` values.
- Physical DB `FOREIGN KEY` constraints are not defined in current schema.

## State/Rule Notes

- Email verify flow:
  - `users.email_verified` changes `false -> true`
  - token is single-use (`used_at`) and time-limited (`expires_at`)
- Password reset flow:
  - token is single-use (`used_at`) and time-limited (`expires_at`)
- Login lockout:
  - `failed_login_attempts` and `locked_until` control lock state
- Deactivation/deletion:
  - `is_active` and `deletion_scheduled_at` represent account lifecycle

## Team Sharing Workflow (Recommended)

When model changes are needed, use this order:
1. Update `schema.ts`
2. Generate/migrate Drizzle (`db:generate`, `db:migrate`)
3. Update this `data-model.md` and `erd.mmd`
4. Update contracts/spec docs if API payload meaning changed
5. Run full checks (`typecheck`, `check:guards`, tests)

PR checklist (for shared understanding):
- Column added/changed/removed?
- Token/security behavior changed?
- API contract impact documented?
- ERD + model guide updated?
- Existing integration/e2e tests updated?

## ERD Preview Guide

### GitHub

- Open `specs/02-email-auth-backend/erd.mmd` in the repository.
- If `.mmd` is not auto-rendered in your view, copy content into a Markdown mermaid block:

```mermaid
%% paste erd.mmd content here
```

### Notion

- Use `/code` block and select `Mermaid`, then paste `erd.mmd` content.
- If Mermaid block is unavailable, export SVG/PNG from Mermaid Live and attach it.

### Mermaid Live Editor

- URL: `https://mermaid.live`
- Paste `erd.mmd` content and export SVG/PNG for slides or documents.

### Team Rule

- Any schema change PR must update both files:
  - `specs/02-email-auth-backend/data-model.md`
  - `specs/02-email-auth-backend/erd.mmd`
