Tech-Stack: specs/00-tech-stack.md

# Feature Specification: Email Auth Frontend

**Feature Branch**: `feature/email-auth-frontend`  
**Created**: 2026-02-26  
**Status**: Completed (Validated on 2026-02-27)  
**Input**: "backend email-auth를 기준으로 frontend를 design system + next.js로 구현"

## Review & Refine (2026-02-26)

### 확인된 이슈

1. 세션 전략은 명시되었지만 화면/라우트 단위에서 예외 처리 기준이 부족했다.
2. `better-auth` 전환 목표는 합의되었으나 초기 구현(REST)과의 경계가 코드 레벨로 더 명확해야 했다.
3. 구현 시작 전 현대적 UI 레이아웃 방향(공통 auth shell) 기준이 문서에 없었다.

### Refine 결정

1. 인증 화면은 공통 `Auth Shell Layout`을 사용하고 페이지별 폼만 교체한다.
2. 인증 호출/세션 제어는 `AuthAdapter` 경계로만 수행한다.
3. Phase A는 REST adapter로 고정하고, Phase C에서 better-auth adapter로 전환한다.

## Review & Refine (2026-02-26, Cycle 2)

### 확인된 이슈

1. SMTP 미구성 로컬 환경에서 이메일 인증/재설정 토큰 동선이 느리고 반복 작업이 많았다.
2. 인증 API 호출이 mutation/query 캐시 전략 없이 개별 폼 로직에 분산될 위험이 있었다.
3. `@repo/ui` 스타일과 웹앱 스타일 정합성에서 semantic utility(`bg-card`) 해석 차이가 발생했다.
4. `/auth/me` 응답 shape(`data.user`)와 프론트 타입 정의가 일치하지 않는 구간이 있었다.

### Refine 결정

1. TanStack Query를 도입해 auth mutation/query를 표준화한다.
2. 로컬 전용 `Dev Auth Tools` 플로팅 패널을 도입해 토큰 기반 검증/재설정 액션을 빠르게 수행한다.
3. 스타일 정합성은 `@repo/ui/styles.css` + 올바른 `@source` 경로 + token explicit class로 고정한다.
4. adapter 타입/쿼리 타입을 실제 backend 응답 shape와 일치시킨다.

## Review & Refine (2026-02-27, Cycle 3)

### 확인된 이슈

1. 문서 간 진행 상태 표현(`spec`/`plan`/`tasks`)이 완전히 동기화되지 않았다.
2. 구현 완료 후 운영 전 검증 게이트(회귀 테스트/배포 전 체크) 기준이 명시적으로 부족했다.

### Refine 결정

1. 본 스펙 상태를 `Ready for Validation`으로 고정하고, 구현 완료와 검증 단계를 구분한다.
2. 최종 종료 기준은 P1 사용자 스토리 재현 + 타입체크/테스트 통과 + 문서 정합성으로 정의한다.

## Tech Stack Reference Rule

- 본 문서의 프론트엔드 스택/버전 결정은 `specs/00-tech-stack.md`를 SSOT로 따른다.
- 충돌 시 본 문서보다 `specs/00-tech-stack.md`를 우선한다.

## Scope

- 포함: `apps/web` Next.js 앱 구성, auth 화면(로그인/회원가입/비밀번호 재설정/이메일 인증), API 연동, 폼 검증, 공통 에러 처리
- 포함: `packages/ui` 기반 UI 소비, Storybook ownership 규칙 준수
- 포함: 단계적 마이그레이션(REST 우선 -> Auth Adapter -> better-auth client 전환)
- 제외: 백엔드 API 계약 변경, 소셜 로그인, 다국어, 고급 계정설정 화면

## API Contract References (Backend SoT)

- Auth API: `specs/02-email-auth-backend/contracts/auth-api.md`
- User API: `specs/02-email-auth-backend/contracts/user-api.md`
- Error Model: `specs/02-email-auth-backend/contracts/error-model.md`

## Session Strategy (Long-Term)

1. Phase A (Now): 기존 backend REST auth 계약(`/api/v1/auth/*`)을 기준으로 세션을 제어한다.
2. Phase B: 프론트의 `AuthAdapter` 레이어를 도입해 REST 구현을 캡슐화한다.
3. Phase C: backend 준비 상태에 맞춰 `better-auth` client를 adapter 내부 구현으로 점진 전환한다.

## UI Layout Direction (Modern)

- 인증 화면은 split layout(브랜드 영역 + 폼 카드) 기반으로 구성한다.
- 모바일에서는 단일 컬럼으로 자동 전환되어야 한다.
- 페이지별 중복 마크업 대신 공통 shell 컴포넌트를 사용한다.
- 시각 요소(그라디언트/배경 형태)는 접근성 대비를 해치지 않는 범위에서 사용한다.

## User Scenarios & Testing

### User Story 1 - 로그인/회원가입 기본 플로우 (Priority: P1)

사용자는 회원가입 후 이메일 인증을 거쳐 로그인하고, 인증 상태를 확인할 수 있어야 한다.

**Why this priority**: 인증 도메인에서 가장 핵심 사용자 가치이며 나머지 기능의 선행조건이다.

**Independent Test**: 회원가입 -> 인증링크 처리 -> 로그인 -> `/auth/me` 기반 세션 확인 흐름이 단독으로 통과해야 한다.

**Acceptance Scenarios**:

1. **Given** 사용자가 유효한 이메일/비밀번호를 입력하면, **When** 회원가입을 제출하면, **Then** `PENDING_VERIFICATION` 안내 상태를 본다.
2. **Given** 사용자가 유효한 인증 토큰 링크로 진입하면, **When** 인증을 완료하면, **Then** `ACTIVE` 상태 안내 후 로그인 화면 또는 앱 홈으로 이동한다.
3. **Given** 인증된 계정이 올바른 자격증명을 입력하면, **When** 로그인하면, **Then** 세션 기반 인증 상태가 유지된다.

---

### User Story 2 - 비밀번호 재설정 플로우 (Priority: P1)

사용자는 비밀번호를 잊었을 때 이메일 재설정 링크를 통해 새 비밀번호를 설정할 수 있어야 한다.

**Why this priority**: 계정 복구 불가 시 서비스 사용이 중단된다.

**Independent Test**: 비밀번호 찾기 요청 -> 토큰 링크 진입 -> 새 비밀번호 설정 -> 로그인 성공까지 단독 검증 가능해야 한다.

**Acceptance Scenarios**:

1. **Given** 사용자가 이메일을 입력하면, **When** 비밀번호 찾기를 요청하면, **Then** 계정 존재 여부를 노출하지 않는 동일한 성공 응답 UX를 본다.
2. **Given** 유효 토큰으로 재설정 페이지에 진입하면, **When** 새 비밀번호를 제출하면, **Then** 재설정 완료 후 로그인 가능 상태가 된다.

---

### User Story 3 - 에러/쿨다운/락 상태 UX (Priority: P2)

사용자는 인증 실패 상황에서 일관된 오류 안내와 재시도 동선을 제공받아야 한다.

**Why this priority**: 보안 정책을 유지하면서 사용자 이탈을 줄이기 위해 필요하다.

**Independent Test**: 대표 에러 코드(`AUTH_INVALID_CREDENTIALS`, `AUTH_REQUEST_COOLDOWN`, `AUTH_ACCOUNT_LOCKED`)별 UI 대응을 단독 확인한다.

**Acceptance Scenarios**:

1. **Given** 로그인 실패가 누적된 계정이면, **When** 재로그인을 시도하면, **Then** 잠금 상태와 재시도 조건을 안내한다.
2. **Given** 재전송/재요청 쿨다운 상태이면, **When** 동일 요청을 반복하면, **Then** UX가 중복 요청 억제 정책과 일치한다.

## Requirements

### Functional Requirements

- **FR-FE-001**: 시스템은 `apps/web`에 Next.js 15 + React 19 + TypeScript strict 기반 앱을 구성해야 한다.
- **FR-FE-002**: auth UI는 `packages/ui` 컴포넌트를 통해 구성해야 하며, 중복 UI 구현을 금지한다.
- **FR-FE-003**: 회원가입 폼은 backend 계약(`POST /api/v1/auth/signup`)과 일치해야 한다.
- **FR-FE-004**: 로그인 폼은 backend 계약(`POST /api/v1/auth/login`)과 일치해야 한다.
- **FR-FE-005**: 이메일 인증 화면은 `GET /api/v1/auth/verify-email` 토큰 흐름을 처리해야 한다.
- **FR-FE-006**: 비밀번호 찾기/재설정 화면은 `POST /forgot-password`, `POST /reset-password` 계약과 일치해야 한다.
- **FR-FE-007**: 폼 검증은 `react-hook-form + zod`로 구현해야 하며, 서버 에러와 필드 에러를 구분 표시해야 한다.
- **FR-FE-008**: API 실패 응답(`{ success:false, code, message, details? }`)은 에러 코드별 표준 UX 매핑을 가져야 한다.
- **FR-FE-009**: 인증 상태 조회는 `GET /api/v1/auth/me`를 사용하고 세션 쿠키 기반 동작을 지원해야 한다.
- **FR-FE-010**: 상태 변경 요청(`POST /logout`)은 CSRF 헤더(`x-csrf-token`)를 포함해야 한다.
- **FR-FE-011**: 모든 feature 문서(`spec/plan/tasks`)는 `Tech-Stack: specs/00-tech-stack.md`를 포함해야 한다.
- **FR-FE-012**: 프론트 인증 호출은 `AuthAdapter` 단일 경계를 통해 수행되어야 한다(직접 fetch 분산 금지).
- **FR-FE-013**: Phase A에서는 `RestAuthAdapter`를 기본 구현으로 사용해야 한다.
- **FR-FE-014**: Phase C 전환을 위해 `BetterAuthAdapter` 인터페이스 호환 조건(메서드 시그니처/반환 타입)을 정의해야 한다.
- **FR-FE-015**: Session control 관련 로직(로그인 상태 조회, 로그아웃, 보호 라우트)은 adapter API만 사용해야 한다.
- **FR-FE-016**: 로그인/회원가입/재설정/인증 화면은 공통 `Auth Shell Layout` 컴포넌트를 사용해야 한다.
- **FR-FE-017**: 인증 관련 라우트는 모바일/데스크톱 모두에서 레이아웃 붕괴 없이 동작해야 한다.
- **FR-FE-018**: auth 상태/요청은 TanStack Query(`useQuery`/`useMutation`)를 통해 관리해야 한다.
- **FR-FE-019**: 로컬 개발 생산성 강화를 위해 dev-only auth 도구 패널을 제공해야 하며, production에서는 노출되면 안 된다.
- **FR-FE-020**: `/auth/me` 응답 shape(`data.user`)를 프론트 타입/렌더링 로직에 정확히 반영해야 한다.
- **FR-FE-021**: `@repo/ui` 스타일 정합성을 위해 Tailwind source 스캔 경로와 token 기반 클래스 적용을 보장해야 한다.

### Key Entities

- **Auth Form Model**: 로그인/회원가입/재설정 입력 모델 및 zod schema
- **Auth Session ViewState**: 인증 여부, 사용자 요약, 로딩/에러 상태
- **Auth Error Mapping**: backend 에러 코드를 사용자 메시지/액션으로 매핑한 테이블
- **Auth Adapter**: `RestAuthAdapter`와 `BetterAuthAdapter`가 공유하는 인증 인터페이스 계층

## Success Criteria

- **SC-FE-001**: 로그인/회원가입/비밀번호 재설정/이메일 인증의 핵심 화면이 `apps/web`에서 동작한다.
- **SC-FE-002**: auth API 연동은 backend 계약 문서와 불일치가 없어야 한다.
- **SC-FE-003**: 최소 1개 E2E 또는 통합 UI 테스트에서 P1 사용자 스토리를 재현해야 한다.
- **SC-FE-004**: 에러 코드별 UX 매핑 문서/구현이 존재하고 주요 코드 3종 이상 검증된다.
- **SC-FE-005**: 타입체크(`pnpm typecheck`)가 프론트엔드 관련 경로에서 통과한다.
- **SC-FE-006**: adapter 경계 바깥에 직접 auth endpoint 호출이 없어야 한다.
- **SC-FE-007**: `RestAuthAdapter`에서 `BetterAuthAdapter`로 교체 가능한 구조(컴파일/테스트)가 보장된다.
- **SC-FE-008**: 모든 auth 페이지가 공통 shell 레이아웃을 사용하고 반응형 검증을 통과한다.
- **SC-FE-009**: 로그인/로그아웃 후 session query invalidation이 동작해 UI 상태가 즉시 반영된다.
- **SC-FE-010**: dev auth 도구는 development 환경에서만 표시되고 production build 사용자 화면에 노출되지 않는다.
- **SC-FE-011**: 주요 입력 컴포넌트 스타일이 Storybook의 `@repo/ui` 기준과 시각적으로 일치한다.
