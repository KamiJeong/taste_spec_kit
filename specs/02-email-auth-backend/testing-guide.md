# Backend Testing Guide

## Prerequisites

- Node.js 22+
- pnpm 10+

## Commands

1. `pnpm --filter @apps/api lint`
2. `pnpm --filter @apps/api typecheck`
3. `pnpm --filter @apps/api test:unit`
4. `pnpm --filter @apps/api test:integration`
5. `pnpm --filter @apps/api test:e2e`
6. `pnpm --filter @apps/api test`

## Test Scope

- Unit
  - health check helper
  - argon2id hash/verify helper
- Integration
  - P1 auth flows
  - P2 reset/profile flows
  - P3 security flows (lockout/session/deactivate)
- E2E
  - auth smoke
  - signup->verify->login->me happy path

## Troubleshooting

- `VALIDATION_ERROR`:
  - 요청 body/query가 Zod 스키마와 일치하는지 확인
- `AUTH_INVALID_CREDENTIALS`:
  - 비밀번호, 해시 상태, 계정 활성 상태 확인
- 테스트 포트 충돌:
  - 테스트는 동적 포트(`bootstrap(0)`)를 사용하므로 고정 포트 점유 여부 확인
- 상태 초기화가 필요한 경우:
  - `node apps/api/test/scripts/reset-state.js`

