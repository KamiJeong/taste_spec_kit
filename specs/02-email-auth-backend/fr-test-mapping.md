# FR-BE Test Mapping (001~020)

이 문서는 `spec.md`의 FR-BE-001~020에 대해 테스트/문서 근거를 추적한다.

## Coverage Matrix

| FR | Requirement Summary | Automated Evidence | Additional Evidence | Status |
|---|---|---|---|---|
| FR-BE-001 | Argon2id 해시 저장 | `apps/api/test/unit/token.service.test.ts`, `apps/api/test/integration/auth-p1.test.ts` | `apps/api/src/modules/auth/auth.service.ts` | Covered |
| FR-BE-002 | 미인증 로그인 차단 | `apps/api/test/integration/auth-p1.test.ts` | - | Covered |
| FR-BE-003 | 토큰 만료/1회 사용 | `apps/api/test/integration/auth-p1.test.ts`, `apps/api/test/integration/auth-p2.test.ts` | - | Covered |
| FR-BE-004 | 로그인 5회 실패 잠금 | `apps/api/test/integration/auth-lockout.test.ts` | - | Covered |
| FR-BE-005 | Redis 세션 관리 | `apps/api/test/integration/auth-session-redis.test.ts`, `apps/api/test/integration/auth-session-invalidation.test.ts` | - | Covered |
| FR-BE-006 | 인증 실패 상세 사유 제한 | `apps/api/test/integration/auth-lockout.test.ts`, `apps/api/test/integration/auth-p1.test.ts`, `apps/api/test/integration/auth-p3.test.ts` | - | Covered |
| FR-BE-007 | 인증 이벤트 감사로그 100% 기록 | `apps/api/test/integration/auth-audit-log.test.ts` | - | Covered |
| FR-BE-008 | Zod + DTO 검증 강제 | `apps/api/test/unit/zod-validation.test.ts`, `apps/api/test/integration/auth-validation.test.ts` | - | Covered |
| FR-BE-009 | Nest 모듈 분해/경계 준수 | `apps/api/test/scripts/check-architecture.cjs` | `apps/api/src/modules/*`, `specs/02-email-auth-backend/spec.md` | Covered |
| FR-BE-010 | REST v1 공식 계약, GraphQL adapter only | `apps/api/test/scripts/check-spec-sync.cjs` (REST transport marker 검증) | `specs/02-email-auth-backend/spec.md` (API Transport Strategy) | Covered |
| FR-BE-011 | 계약 변경 시 frontend spec API 매핑 동기화 | `apps/api/test/scripts/check-spec-sync.cjs` (spec/contracts endpoint surface sync) | `specs/02-email-auth-backend/contracts/*` | Covered |
| FR-BE-012 | 계정 상태 전이 규칙 준수 | `apps/api/test/integration/auth-p1.test.ts`, `apps/api/test/integration/auth-p3.test.ts`, `apps/api/test/integration/auth-session-invalidation.test.ts` | - | Covered |
| FR-BE-013 | Security baseline 준수 | `apps/api/test/integration/auth-security-baseline.test.ts`, `apps/api/test/e2e/auth-security.test.ts` | `apps/api/test/integration/auth-validation.test.ts` | Covered |
| FR-BE-014 | contracts-auth 공용 계약 일치 | `apps/api/test/unit/http-contract.test.ts`, `apps/api/test/integration/auth-envelope.test.ts` | `packages/contracts-auth/src/*` | Covered |
| FR-BE-015 | 응답 Envelope/Headers 준수 | `apps/api/test/unit/http-contract.test.ts`, `apps/api/test/integration/auth-envelope.test.ts` | - | Covered |
| FR-BE-016 | resend/forgot idempotent | `apps/api/test/integration/auth-idempotent.test.ts` | - | Covered |
| FR-BE-017 | 감사로그 최소 스키마 준수 | `apps/api/test/integration/auth-audit-log.test.ts` | - | Covered |
| FR-BE-018 | contracts-auth TS 소스 + declaration 유지 | `apps/api/package.json` `pretest*` + CI build step, `packages/contracts-auth` build | `packages/contracts-auth/tsconfig.json`, `packages/contracts-auth/dist/*.d.ts` | Covered |
| FR-BE-019 | 통합/E2E/프로덕션 in-memory fallback 금지 | `apps/api/test/integration/fail-fast.test.ts`, `apps/api/test/integration/env.test.ts` | `apps/api/src/modules/persistence/*`, `apps/api/src/modules/session/*` | Covered |
| FR-BE-020 | `.env.template` + `docker-compose.yml` 기반 로컬 재현/민감정보 분리 | `apps/api/test/integration/env.test.ts` | `.env.template`, `apps/api/.env.template`, `docker-compose.yml` | Covered |

## Notes

- FR-BE-009~011은 `check:guards` 스크립트(architecture/spec-sync)로 CI에서 자동 검증한다.
