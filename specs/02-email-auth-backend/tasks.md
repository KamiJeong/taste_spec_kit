# Tasks: Email Auth User Management (Backend)

## Execution Rule

- Gate 순서 준수: `Phase 0 -> 1 -> 2 -> 3 -> 4 -> 5`
- Gate 0 완료 전 기능 구현 태스크 착수 금지

## Phase 0: Repository/Test Harness Readiness (Gate 0, Blocking)

- [x] BE-T000 루트 워크스페이스 파일 생성 (`package.json`, `pnpm-workspace.yaml`, `turbo.json`)
- [x] BE-T001 백엔드 앱 골격 생성 (`apps/api/package.json`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`)
- [x] BE-T002 테스트 스크립트 정의 (`apps/api/package.json`: `test`, `test:unit`, `test:integration`, `test:e2e`)
- [x] BE-T003 테스트 환경 파일/가이드 생성 (`apps/api/.env.test`, `apps/api/test/README.md`)
- [x] BE-T004 샘플 테스트 1건 추가 및 실행 성공 (`apps/api/test/unit/health.test.js`)

## Phase 1: Contract Freeze (Gate 1)

- [x] BE-T005 인증 API 계약 작성 (`specs/02-email-auth-backend/contracts/auth-api.md`)
- [x] BE-T006 사용자 API 계약 작성 (`specs/02-email-auth-backend/contracts/user-api.md`)
- [x] BE-T007 에러 코드/응답 포맷 표준화 (`specs/02-email-auth-backend/contracts/error-model.md`)
- [x] BE-T008 API Surface와 계약 문서 정합성 검토 (`specs/02-email-auth-backend/spec.md`)

## Phase 2: P1 Implementation (Gate 2)

- [x] BE-T009 Signup/Verify/Resend 엔드포인트 구현 (`/api/v1/auth/signup`, `/verify-email`, `/resend-verification`)
- [x] BE-T010 Login/Logout/Me 엔드포인트 구현 (`/api/v1/auth/login`, `/logout`, `/me`)
- [x] BE-T011 Argon2id 해시 정책 적용 및 검증 (FR-BE-001)
- [x] BE-T012 이메일 미인증 로그인 차단 적용 (FR-BE-002)
- [x] BE-T013 P1 회귀 테스트 작성 (중복 이메일, 만료 토큰, 미인증 로그인)

## Phase 3: P2 Implementation (Gate 3)

- [x] BE-T014 Forgot/Reset Password 구현 (`/api/v1/auth/forgot-password`, `/reset-password`)
- [x] BE-T015 Profile 조회/수정 구현 (`/api/v1/users/profile`, `PATCH /profile`)
- [x] BE-T016 Change Password 구현 (`/api/v1/users/change-password`)
- [x] BE-T017 토큰 1회 사용/만료 처리 검증 (FR-BE-003)
- [x] BE-T018 P2 통합 테스트 작성 (재설정 성공/실패, 프로필 수정)

## Phase 4: P3 + Security/Ops (Gate 4)

- [x] BE-T019 계정 비활성화/삭제예약 구현 (`/api/v1/users/deactivate`, `/request-deletion`, `/cancel-deletion`)
- [x] BE-T020 로그인 실패 5회/15분 잠금 로직 적용 (FR-BE-004)
- [x] BE-T021 Redis 세션 전략/TTL 검증 (FR-BE-005)
- [x] BE-T022 인증 실패 사유 노출 제한 검증 (FR-BE-006)
- [x] BE-T023 AuthLog 이벤트 기록 100% 보장 (FR-BE-007)
- [x] BE-T024 DTO + Zod 검증 강제 (FR-BE-008)
- [x] BE-T025 보안 회귀 테스트 작성 (잠금 계정, 비활성화 계정, 세션 무효화)

## Phase 5: Test Automation and CI (Gate 5)

- [x] BE-T026 Unit 테스트 스위트 확장 (`apps/api/test/unit/*`)
- [x] BE-T027 Integration 테스트 스위트 확장 (`apps/api/test/integration/*`)
- [x] BE-T028 E2E 테스트 스위트 작성 (`apps/api/test/e2e/*`)
- [x] BE-T029 CI 파이프라인 구성 (`.github/workflows/backend-ci.yml`)
- [x] BE-T030 테스트 데이터 초기화/정리 스크립트 작성 (`apps/api/test/scripts/*`)
- [x] BE-T031 테스트 트러블슈팅 문서화 (`specs/02-email-auth-backend/testing-guide.md`)

## Done Checklist

- [x] FR-BE-001~008 모두 테스트 케이스로 커버
- [x] TR-BE-001~005 충족
- [x] `spec.md` API Surface와 실제 구현 경로 일치
- [x] 로컬/CI에서 동일 명령으로 테스트 재현 가능
