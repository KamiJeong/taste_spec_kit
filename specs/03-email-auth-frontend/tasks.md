Tech-Stack: specs/00-tech-stack.md

# Tasks: Email Auth Frontend

## Execution Rule

- 우선순위: `P1 -> P2`
- `apps/web` 구성 완료 전 화면 구현 시작 금지
- backend 계약(`specs/02-email-auth-backend/contracts/*`)과 불일치 시 구현보다 계약 정합성 확인을 먼저 수행

## Phase 1: Setup (Blocking)

- [x] FE-T001 `apps/web` Next.js 앱 초기화 (TS strict, App Router, Tailwind v4)
- [x] FE-T002 workspace 설정 반영 (`pnpm-workspace.yaml`, 루트 scripts/turbo 파이프라인 연결)
- [x] FE-T003 `apps/web` 환경 템플릿 추가 (`apps/web/.env.template`)
- [x] FE-T004 `@repo/ui` 소비 기본 wiring (provider/global styles/import 경로 정리)
- [x] FE-T005 공통 `Auth Shell Layout` 스켈레톤 생성 (`apps/web/src/features/auth/ui/auth-shell.tsx`)

## Phase 2: Foundation (Blocking)

- [x] FE-T006 auth API client 모듈 생성 (`apps/web/src/features/auth/api/client.ts`)
- [x] FE-T007 에러 코드 매핑 테이블 구현 (`apps/web/src/features/auth/api/error-map.ts`)
- [x] FE-T008 공통 zod 스키마 및 RHF resolver 연결 (`apps/web/src/features/auth/schemas/*`)
- [x] FE-T009 `AuthAdapter` 인터페이스 정의 (`apps/web/src/features/auth/api/adapter.ts`)
- [x] FE-T010 `RestAuthAdapter` 구현 (`apps/web/src/features/auth/api/rest-adapter.ts`)
- [x] FE-T011 세션 조회/로그아웃 유틸을 adapter 기반으로 구현 (`/auth/me`, `/auth/logout`)

## Phase 3: User Story 1 - Signup/Login/Verify (P1)

**Goal**: 회원가입 -> 인증 -> 로그인의 기본 인증 플로우를 제공

**Independent Test**: 신규 계정 생성 후 인증/로그인 성공, 미인증 로그인 거부 UI 검증

- [x] FE-T012 [US1] 회원가입 페이지 구현 (`apps/web/app/(auth)/signup/page.tsx`)
- [x] FE-T013 [US1] 로그인 페이지 구현 (`apps/web/app/(auth)/login/page.tsx`)
- [x] FE-T014 [US1] 이메일 인증 처리 페이지 구현 (`apps/web/app/(auth)/verify-email/page.tsx`)
- [x] FE-T015 [US1] 인증 상태 가드/리다이렉트 기초 구현 (`apps/web/src/features/auth/ui/*`)
- [x] FE-T016 [US1] US1 흐름 테스트 추가 (Playwright 또는 통합 테스트)

## Phase 4: User Story 2 - Forgot/Reset Password (P1)

**Goal**: 계정 복구를 위한 비밀번호 찾기/재설정 플로우 제공

**Independent Test**: 비밀번호 찾기 요청 후 토큰 기반 재설정 완료 및 재로그인 성공

- [x] FE-T017 [US2] 비밀번호 찾기 페이지 구현 (`apps/web/app/(auth)/forgot-password/page.tsx`)
- [x] FE-T018 [US2] 비밀번호 재설정 페이지 구현 (`apps/web/app/(auth)/reset-password/page.tsx`)
- [x] FE-T019 [US2] 쿨다운/동일성 응답 UX 구현 (계정 존재 여부 비노출)
- [x] FE-T020 [US2] US2 흐름 테스트 추가

## Phase 5: User Story 3 - Error/Lock/Cooldown UX (P2)

**Goal**: 주요 에러 코드 기반 사용자 안내와 재시도 동선 제공

**Independent Test**: 잠금/쿨다운/자격증명 오류 시 기대하는 UX가 표시됨

- [x] FE-T021 [US3] 코드별 에러 배너/필드메시지 컴포넌트 구현
- [x] FE-T022 [US3] `AUTH_ACCOUNT_LOCKED`/`AUTH_REQUEST_COOLDOWN` 대응 UX 구현
- [x] FE-T023 [US3] `AUTH_INVALID_CREDENTIALS`/`VALIDATION_ERROR` 대응 UX 구현
- [x] FE-T024 [US3] 에러 매핑 단위 테스트 추가

## Phase 6: Migration Readiness (Better Auth, P2)

- [x] FE-T025 `BetterAuthAdapter` 스켈레톤 생성 (`apps/web/src/features/auth/api/better-auth-adapter.ts`)
- [x] FE-T026 adapter 호환 테스트 추가 (Rest/Better 구현 공통 시그니처 검증)
- [x] FE-T027 전환 플래그/설정 전략 문서화 (`specs/03-email-auth-frontend/plan.md` 반영)

## Phase 7: Polish & Quality Gates

- [x] FE-T028 접근성 점검 (폼 라벨, 오류 aria, 키보드 포커스)
- [x] FE-T029 타입체크/린트/테스트 실행 및 수정
- [x] FE-T030 문서 동기화 (`spec.md`, `plan.md`, `tasks.md` 상태 업데이트)

## Phase 8: Query/DevTools/Style Parity (Refine)

- [x] FE-T031 TanStack Query provider 도입 (`apps/web/src/app/query-provider.tsx`, `apps/web/app/layout.tsx`)
- [x] FE-T032 auth query/mutation hooks 추가 및 폼 mutation 전환 (`apps/web/src/features/auth/api/queries.ts`, `apps/web/src/features/auth/ui/*`)
- [x] FE-T033 dev-only floating auth panel 추가 (`apps/web/src/features/auth/dev/dev-auth-tools.tsx`)
- [x] FE-T034 signup/forgot debug token 저장 및 verify/reset 빠른 이동 액션 추가
- [x] FE-T035 Vitest + Testing Library 테스트 환경 및 auth 테스트 추가 (`apps/web/vitest.config.ts`, `apps/web/src/test/setup.tsx`, `apps/web/src/features/auth/**/*.test.ts*`)
- [x] FE-T036 `@repo/ui` style parity 정렬 (`apps/web/app/globals.css` source 경로/토큰 클래스 적용)
- [x] FE-T037 `/auth/me` 응답 타입(`data.user`) 정합화 (`apps/web/src/features/auth/api/adapter.ts`, `rest-adapter.ts`, session UI)

## Done Checklist

- [ ] FR-FE-001~021 커버
- [x] P1 사용자 스토리 단독 동작 확인
- [x] backend 계약 문서와 요청/응답 shape 일치 확인
