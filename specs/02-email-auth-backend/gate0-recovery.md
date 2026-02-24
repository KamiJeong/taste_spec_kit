# Gate 0 Recovery Checklist (Backend)

**Date**: 2026-02-23  
**Scope**: `specs/02-email-auth-backend` 재구현을 위한 최소 복구 기준

## Goal

Gate 0 통과 조건(`apps/api` 부팅 + 테스트 명령 4종 실행 가능)을 만족하는 최소 파일을 복구한다.

## Required Root Files

- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`

## Required Workspace Paths

- `apps/api/package.json`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/.env.test`
- `apps/api/test/README.md`
- `apps/api/test/unit/health.test.ts`
- `apps/api/test/integration/env.test.ts`
- `apps/api/test/e2e/smoke.test.ts`

## Required `apps/api` Scripts

`apps/api/package.json`에 아래 스크립트가 존재해야 한다.

- `test`
- `test:unit`
- `test:integration`
- `test:e2e`

## Verification Order

1. 루트 파일 존재 확인 (`package.json`, `pnpm-workspace.yaml`, `turbo.json`)
2. `apps/api` 최소 파일 존재 확인
3. `pnpm --filter @apps/api test:unit`
4. `pnpm --filter @apps/api test:integration`
5. `pnpm --filter @apps/api test:e2e`
6. `pnpm --filter @apps/api test`

## Exit Rule

위 1~6 단계가 모두 성공하면 Gate 0를 통과로 판단하고 `BE-T000~BE-T004`를 체크한다.
