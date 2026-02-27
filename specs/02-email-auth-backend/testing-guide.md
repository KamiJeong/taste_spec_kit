# Backend Testing Guide

- FR 매핑 문서: [`fr-test-mapping.md`](./fr-test-mapping.md)
- 메일/인증 운영 런북: [`email-verification-runbook.md`](./email-verification-runbook.md)

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker / Docker Compose

## Commands

아래 명령은 워크스페이스(`apps/api`, `packages/contracts-auth`, 루트 manifest) 복구 후 실행한다.

0. 환경 준비
   - `pnpm run local:env`
   - 템플릿 변경 동기화가 필요하면 `pnpm run local:env:force`
   - `pnpm run local:up`
   - 주의: prod/stage/dev 실서버 정보는 `.env`에 넣지 않는다.
   - 메일 기본 모드: `MAIL_TRANSPORT=log` (SMTP 실전송 테스트 시 `smtp`로 전환)
   - 테스트 토큰 노출: `NODE_ENV=test` 또는 `MAIL_EXPOSE_TOKENS=true`

1. `pnpm --filter @packages/contracts-auth build`
2. `pnpm --filter @apps/api db:generate` (스키마 변경 시)
3. `pnpm --filter @apps/api db:migrate`
4. `pnpm --filter @apps/api lint`
5. `pnpm --filter @apps/api typecheck`
6. `pnpm --filter @apps/api check:guards`
7. `pnpm --filter @apps/api test:unit`
8. `pnpm --filter @apps/api test:integration`
9. `pnpm --filter @apps/api test:e2e`
10. `pnpm --filter @apps/api test`
11. 테스트 상태 수동 초기화: `pnpm --filter @apps/api test:reset-state`

## Test Scope

- Unit
  - health check helper
  - argon2id hash/verify helper
  - response envelope serializer (`success/data/meta`, `code/message/details`)
  - request-id generator/helper
- Integration
  - P1 auth flows
  - P2 reset/profile flows
  - P3 security flows (lockout/session/deactivate)
  - idempotent cooldown (`resend-verification`, `forgot-password`)
  - audit log minimum schema 필드 보장
- E2E
  - auth smoke
  - signup->verify->login->me happy path
  - security baseline (CSRF, rate limit)
  - error response + `X-Request-Id` 헤더 검증

## Mandatory Assertions (TR-BE-009~011)

- 모든 API 응답에서 `X-Request-Id` 헤더가 존재해야 한다.
- 시간 기준 응답은 `meta.serverTime`(ISO-8601 UTC)을 포함해야 한다.
- 재요청 엔드포인트는 중복 요청 시 idempotent 동작(성공 동일 응답 또는 `AUTH_REQUEST_COOLDOWN`)을 유지해야 한다.
- 감사 로그는 최소 필드(`eventId`, `eventType`, `ip`, `userAgent`, `result`, `occurredAt`)를 누락 없이 저장해야 한다.
- `db:migrate` 실행 후 `__drizzle_migrations` 및 핵심 테이블(`users`, `verification_tokens`, `password_reset_tokens`) 존재를 검증해야 한다.
- `DATABASE_URL`/`REDIS_URL` 누락 또는 미연결 상태에서 앱 부팅이 실패(fail-fast)하는지 검증해야 한다.

## Build Chain Assertion (TR-BE-012)

- backend 테스트 실행 전 `@packages/contracts-auth` 빌드가 선행되어야 한다.
- `apps/api`의 `pretest*` 스크립트는 공용 계약 패키지 빌드를 자동으로 수행해야 한다.
- CI(`.github/workflows/backend-ci.yml`)는 `typecheck + check:guards + lint + unit + integration + e2e`를 순서대로 실행해야 한다.

## Recommended Test Matrix

1. Envelope/Headers
2. State transitions (`PENDING_VERIFICATION -> ACTIVE`, `ACTIVE -> DEACTIVATED`)
3. Security baseline (CSRF, rate limit, token one-time use)
4. Idempotent flows (`resend-verification`, `forgot-password`)
5. Audit log schema completeness

## Troubleshooting

- `VALIDATION_ERROR`:
  - 요청 body/query가 Zod 스키마와 일치하는지 확인
- `AUTH_INVALID_CREDENTIALS`:
  - 비밀번호, 해시 상태, 계정 활성 상태 확인
- `AUTH_REQUEST_COOLDOWN`:
  - 쿨다운 윈도우 설정값, 중복 억제 키(이메일/IP), TTL 처리 확인
- `RATE_LIMIT_EXCEEDED`:
  - 레이트리밋 스토어(예: Redis) 연결 상태, 키 스코프(IP+계정) 확인
- `AUTH_CSRF_INVALID`:
  - CSRF 토큰 전달 경로(헤더/쿠키), SameSite 정책, 테스트 클라이언트 쿠키 전달 여부 확인
- 메일 전송 실패:
  - `MAIL_TRANSPORT=smtp`일 때 `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/MAIL_FROM` 설정 확인
  - 로컬에서는 `MAIL_TRANSPORT=log`로 전환해 링크 로그 출력 여부 확인
- 테스트 포트 충돌:
  - 테스트는 동적 포트(`bootstrap(0)`)를 사용하므로 고정 포트 점유 여부 확인
- 상태 초기화가 필요한 경우:
  - `pnpm --filter @apps/api test:reset-state`
  - 동작: PostgreSQL 핵심 테이블 truncate + Redis `FLUSHDB`
