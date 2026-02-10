Tech-Stack: specs/00-tech-stack.md

# Setup Guide: 02-storybook-shadcn-forms

## Status (2026-02-10)

Phase 1/2 foundational skeleton has been created:

- Root workspace files: `package.json`, `pnpm-workspace.yaml`
- Storybook app: `apps/storybook/*`
- Local UI package: `packages/ui/*`
- Shared Storybook helpers:
  - `apps/storybook/src/stories/_shared/decorators.tsx`
  - `apps/storybook/src/stories/_shared/form-fixtures.ts`
  - `apps/storybook/src/stories/_shared/breakpoints.ts`

## Install

Run from repository root:

```powershell
pnpm install
```

## Run

Run Storybook dev server:

```powershell
pnpm storybook
```

Build Storybook:

```powershell
pnpm build-storybook
```

Type check:

```powershell
pnpm typecheck
```

Tests:

```powershell
pnpm test
```

## Decisions Applied

- RQ1: Local vendored UI package (`packages/ui`) is used.
- RQ2: Visual regression baseline is OSS snapshot approach (Chromatic optional).

## CI Run Guide (for T030)

Minimum pipeline steps:

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build-storybook`

## Quality Gate Results

Executed on 2026-02-10:

- `pnpm install` ✅
- `pnpm typecheck` ✅
- `pnpm test` ✅ (6 files, 15 tests passed)
- `pnpm build-storybook` ✅ (`apps/storybook/storybook-static` generated)

Notes from build output:

- Storybook telemetry notice printed (informational)
- Large chunk warnings were reported by Vite/Storybook (non-blocking)

## Notes

- US1/US2 story and test files were added.
- US3/US4 story and test files were added.
