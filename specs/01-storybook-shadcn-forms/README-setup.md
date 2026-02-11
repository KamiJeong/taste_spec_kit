Tech-Stack: specs/00-tech-stack.md

# Setup Guide: 01-storybook-shadcn-forms

## Install Workflow (Standard)

1. `pnpm dlx shadcn@latest init --cwd packages/ui`
2. `pnpm dlx shadcn@latest add <component> --cwd packages/ui`
3. Export from `packages/ui/src/index.ts`
4. Consume via `@repo/ui` in `apps/storybook/src/stories`

## Current Install Attempt Log (2026-02-11)

- `pnpm dlx shadcn@latest init --cwd packages/ui` -> failed (`EACCES`)
- `pnpm dlx shadcn@latest add ... --cwd packages/ui` -> failed (`EACCES`)
- logs:
  - `specs/01-storybook-shadcn-forms/shadcn-init.log`
  - `specs/01-storybook-shadcn-forms/shadcn-init-retry.log`
  - `specs/01-storybook-shadcn-forms/shadcn-add.log`

## Retry Result (2026-02-11)

- `pnpm dlx shadcn@latest init --cwd packages/ui --yes`
  - Result: expected preflight stop, `components.json` already exists in `packages/ui` (already initialized).
- `pnpm dlx shadcn@latest add button input select checkbox radio-group dialog form label --cwd packages/ui --yes`
  - Result: PASS, regenerated 8 files under `packages/ui/src/components/ui/*`.

## EACCES Fix Note

- Cause: `pnpm dlx` could not fetch `https://registry.npmjs.org/shadcn` in restricted execution, reported as `EACCES`.
- Resolution used for retry: run `pnpm dlx shadcn@latest ...` with network-enabled execution and default pnpm store settings.
- Ownership rules remain unchanged: stories consume components only through `@repo/ui`.

## Quality Gates

- `pnpm install`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build-storybook`

## Quality Gate Results (2026-02-11)

- `pnpm install`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: PASS
- `pnpm build-storybook`: PASS
- Note: Storybook build reports non-blocking bundle-size warnings and Radix `"use client"` directive warnings.

## Ownership Checklist

- [x] `apps/storybook/src`에 UI 구현 파일 없음
- [x] story 파일에서 인터랙티브 UI는 `@repo/ui` import 사용
- [x] `packages/ui/src/components/ui`와 `shadcn-component-catalog.md` 매핑 일치
