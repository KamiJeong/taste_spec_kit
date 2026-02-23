Tech-Stack: specs/00-tech-stack.md

# Tasks: Email Auth User Management (Backend)

## Status Sync Note (2026-02-23)

- Gate 3/4(P1/P2) 구현/테스트 통과 기준으로 상태를 동기화했다.
- Gate 5/6 + 인프라 강제 규칙(Postgres/Redis/Drizzle) 항목을 다음 우선순위로 고정한다.

## Execution Rule

- Gate 순서 준수: `Phase 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6`
- Gate 0 완료 전 기능 구현 태스크 착수 금지
- 라이브러리/버전 선택 태스크는 `specs/00-tech-stack.md` 기준으로만 수행

## Phase 0: Repository/Test Harness Readiness (Gate 0, Blocking)

- [x] BE-T000 루트 워크스페이스 파일 검증 (`package.json`, `pnpm-workspace.yaml`, `turbo.json`) - 기준: `gate0-recovery.md`
- [x] BE-T001 백엔드 앱 골격 검증 (`apps/api/package.json`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`) - 기준: `gate0-recovery.md`
- [x] BE-T002 테스트 스크립트 검증 (`apps/api/package.json`: `test`, `test:unit`, `test:integration`, `test:e2e`)
- [x] BE-T003 테스트 환경 파일/가이드 검증 (`apps/api/.env.test`, `apps/api/test/README.md`)
- [x] BE-T004 샘플 테스트 실행 확인 (`apps/api/test/unit/health.test.js`)
- [x] BE-T047 환경 템플릿/보안 규칙 반영 (`.env.template`, `apps/api/.env.template`, `.gitignore`)
- [x] BE-T048 로컬 인프라 compose 기준 확정 (`docker-compose.yml`: PostgreSQL/Redis)

## Phase 1: Architecture Freeze (Gate 1)

- [x] BE-T005 Nest 모듈 분해 설계 확정 (`Auth/User/Session/Token/Mail/Queue/AuditLog/Persistence/Shared`)
- [x] BE-T006 모듈 간 의존 경계 검증 규칙 정의 (Controller->Service->Repository)
- [x] BE-T007 REST 우선 + GraphQL adapter 전략 확정 (`spec.md` 반영)
- [x] BE-T008 아키텍처 결정사항을 코드 구조(`apps/api/src/modules/*`)에 반영

## Phase 2: Contract Freeze (Gate 2)

- [x] BE-T009 인증 API 계약 정밀화 (`specs/02-email-auth-backend/contracts/auth-api.md`)
- [x] BE-T010 사용자 API 계약 정밀화 (`specs/02-email-auth-backend/contracts/user-api.md`)
- [x] BE-T011 에러 코드/응답 포맷 표준화 (`specs/02-email-auth-backend/contracts/error-model.md`)
- [x] BE-T012 API Surface와 계약 문서 정합성 검토 (`specs/02-email-auth-backend/spec.md`)
- [x] BE-T036 응답 Envelope/헤더 계약 고정 (`success/data/meta`, `code/message/details`, `X-Request-Id`, `meta.serverTime`) (FR-BE-015)
- [x] BE-T037 재요청 idempotent 계약 고정 (`/auth/resend-verification`, `/auth/forgot-password`) (FR-BE-016)
- [x] BE-T038 감사로그 최소 스키마 계약 고정 (`eventId`, `eventType`, `ip`, `userAgent`, `result`, `occurredAt`) (FR-BE-017)
- [x] BE-T045 공용 계약 패키지 TS 전환 및 declaration 출력 고정 (`packages/contracts-auth/src/*.ts`, `dist/*.d.ts`) (FR-BE-018)

## Phase 3: P1 Implementation (Gate 3)

- [x] BE-T013 Signup/Verify/Resend 엔드포인트 구현 (`/api/v1/auth/signup`, `/verify-email`, `/resend-verification`)
- [x] BE-T014 Login/Logout/Me 엔드포인트 구현 (`/api/v1/auth/login`, `/logout`, `/me`)
- [x] BE-T015 Argon2id 해시 정책 적용 및 검증 (FR-BE-001)
- [x] BE-T016 이메일 미인증 로그인 차단 적용 (FR-BE-002)
- [x] BE-T017 P1 회귀 테스트 작성 (중복 이메일, 만료 토큰, 미인증 로그인)

## Phase 4: P2 Implementation (Gate 4)

- [x] BE-T018 Forgot/Reset Password 구현 (`/api/v1/auth/forgot-password`, `/reset-password`)
- [x] BE-T019 Profile 조회/수정 구현 (`/api/v1/users/profile`, `PATCH /profile`)
- [x] BE-T020 Change Password 구현 (`/api/v1/users/change-password`)
- [x] BE-T021 토큰 1회 사용/만료 처리 검증 (FR-BE-003)
- [x] BE-T022 P2 통합 테스트 작성 (재설정 성공/실패, 프로필 수정)

## Phase 5: P3 + Security/Ops (Gate 5)

- [ ] BE-T023 계정 비활성화/삭제예약 구현 (`/api/v1/users/deactivate`, `/request-deletion`, `/cancel-deletion`)
- [ ] BE-T024 로그인 실패 5회/15분 잠금 로직 적용 (FR-BE-004)
- [ ] BE-T025 Redis 세션 전략/TTL 검증 (FR-BE-005)
- [ ] BE-T026 인증 실패 사유 노출 제한 검증 (FR-BE-006)
- [ ] BE-T027 AuthLog 이벤트 기록 100% 보장 (FR-BE-007)
- [ ] BE-T028 DTO + Zod 검증 강제 (FR-BE-008)
- [ ] BE-T029 보안 회귀 테스트 작성 (잠금 계정, 비활성화 계정, 세션 무효화)
- [ ] BE-T039 Envelope/헤더 구현 반영 및 미들웨어 적용 (`X-Request-Id`, `meta.serverTime`) (FR-BE-015)
- [ ] BE-T040 idempotent 쿨다운/중복 억제 로직 구현 (`resend-verification`, `forgot-password`) (FR-BE-016)
- [ ] BE-T041 감사로그 최소 스키마 저장/조회 보장 (FR-BE-017)
- [x] BE-T049 통합/E2E/프로덕션 환경에서 in-memory fallback 제거 (FR-BE-019)
- [x] BE-T050 Drizzle migration 워크플로우 도입 (`generate`, `migrate`, 스키마 버전관리) (FR-BE-019)
- [x] BE-T051 로컬 `.env.template` + `docker-compose.yml` 기반 실행 절차를 런타임/문서/스크립트에 고정 (FR-BE-020)

## Phase 6: Test Automation and CI (Gate 6)

- [ ] BE-T030 Unit 테스트 스위트 확장 (`apps/api/test/unit/*`)
- [ ] BE-T031 Integration 테스트 스위트 확장 (`apps/api/test/integration/*`)
- [ ] BE-T032 E2E 테스트 스위트 작성 (`apps/api/test/e2e/*`)
- [ ] BE-T033 CI 파이프라인 구성 (`.github/workflows/backend-ci.yml`)
- [ ] BE-T034 테스트 데이터 초기화/정리 스크립트 작성 (`apps/api/test/scripts/*`)
- [ ] BE-T035 테스트 트러블슈팅 문서화 (`specs/02-email-auth-backend/testing-guide.md`)
- [ ] BE-T042 응답 Envelope/헤더 검증 테스트 추가 (`X-Request-Id`, `meta.serverTime`) (TR-BE-009)
- [ ] BE-T043 idempotent 처리 검증 테스트 추가 (재전송/재요청 쿨다운) (TR-BE-010)
- [ ] BE-T044 감사로그 최소 스키마 필드 검증 테스트 추가 (TR-BE-011)
- [ ] BE-T046 backend 테스트 전 공용 계약 빌드 선행 보장 (`pretest`, `pretest:integration`, `pretest:e2e`) (TR-BE-012)
- [x] BE-T052 Drizzle migration 실행 검증 태스크 추가 (TR-BE-013)
- [x] BE-T053 `DATABASE_URL`/`REDIS_URL` 누락·미연결 fail-fast 테스트 추가 (TR-BE-014)

## Done Checklist

- [ ] FR-BE-001~020 모두 테스트 케이스로 커버
- [ ] TR-BE-001~014 충족
- [ ] `spec.md` API Surface와 실제 구현 경로 일치
- [ ] 로컬/CI에서 동일 명령으로 테스트 재현 가능

