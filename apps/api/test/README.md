# API Test Harness

This folder contains the minimal test scaffold required for Gate 0.

Available commands:

- `pnpm --filter @apps/api test:unit`
- `pnpm --filter @apps/api test:integration`
- `pnpm --filter @apps/api test:e2e`
- `pnpm --filter @apps/api test`
- `pnpm --filter @apps/api test:reset-state` (PostgreSQL + Redis test state reset)
