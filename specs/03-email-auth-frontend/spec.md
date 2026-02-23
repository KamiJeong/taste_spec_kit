Tech-Stack: specs/00-tech-stack.md

# Feature Specification: Email Auth User Management (Frontend)

**Feature Branch**: `spec/03-email-auth-frontend`  
**Created**: 2026-02-12  
**Updated**: 2026-02-23  
**Status**: Refined  
**Input**: Backend 계약(`specs/02-email-auth-backend`) 기반 UI/UX 범위 분리

## Tech Stack Reference Rule

- 본 문서의 프론트 스택/버전은 `specs/00-tech-stack.md`를 SSOT로 따른다.
- 충돌 시 본 문서보다 `specs/00-tech-stack.md`를 우선한다.

## History

- 폴더: [`history/`](./history/)
- 오늘 이력: [`history/2026-02-23.md`](./history/2026-02-23.md)

## Scope

이 스펙은 클라이언트 측 인증/회원관리 UX만 다룬다.

- 포함: 로그인/회원가입/비밀번호 재설정/프로필/계정설정 화면, 폼 검증 UX, 라우트 보호
- 포함: API 호출 어댑터, 인증 상태관리, 에러/성공 상태 표시
- 제외: DB 스키마, 토큰 생성, 세션 저장, 메일 큐 처리

## Route Surface (App v1)

- `/auth/signup`: 회원가입 화면
- `/auth/verify-email`: 이메일 인증 결과 화면(토큰 검증 결과 표시)
- `/auth/login`: 로그인 화면
- `/auth/forgot-password`: 비밀번호 재설정 요청 화면
- `/auth/reset-password`: 토큰 기반 비밀번호 재설정 화면
- `/settings/profile`: 프로필 조회/수정 화면(보호 라우트)
- `/settings/security`: 비밀번호 변경/계정 비활성화/삭제 예약 화면(보호 라우트)

## Frontend-Backend API Mapping (Mandatory)

- 회원가입: `POST /api/v1/auth/signup`
- 이메일 인증 결과: `GET /api/v1/auth/verify-email`
- 인증 메일 재발송: `POST /api/v1/auth/resend-verification`
- 로그인/로그아웃: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`
- 세션 사용자 조회: `GET /api/v1/auth/me`
- 비밀번호 찾기/재설정: `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`
- 프로필 조회/수정: `GET /api/v1/users/profile`, `PATCH /api/v1/users/profile`
- 비밀번호 변경: `POST /api/v1/users/change-password`
- 비활성화/삭제예약/취소: `POST /api/v1/users/deactivate`, `POST /api/v1/users/request-deletion`, `POST /api/v1/users/cancel-deletion`

## Shared Contract Model (Backend/Frontend)

- 공용 계약은 `packages/contracts-auth`를 소비한다.
- 폼 검증 스키마와 API 응답 타입은 공용 `zod schema`와 `inferred type`을 우선 사용한다.
- UI 전용 상태(`uiErrorCode`, 로딩 상태, 화면 전용 필드)는 frontend 내부 타입으로 분리한다.
- backend 계약 변경 시 frontend는 공용 패키지 버전 업데이트를 통해 컴파일 단계에서 영향 범위를 확인한다.
- 공용 패키지는 TypeScript source(`src/*.ts`)를 기준으로 유지하고, 앱은 빌드 산출물과 타입 선언(`dist/*.d.ts`)을 사용한다.

## API Envelope Consumption Rules

- frontend API 어댑터는 성공 응답에서 `data`를 기준으로 파싱하고 `meta`는 부가 정보로 처리한다.
- 실패 응답은 `code`, `message`, `details`를 표준 에러 모델로 정규화한다.
- `X-Request-Id`는 에러 리포트/로그 상관관계(traceability)를 위해 클라이언트 로그 컨텍스트에 보존한다.

## User Stories

### US-FE-1 (P1): 회원가입/이메일 인증 화면
- 회원가입 폼 입력, 실시간 유효성 검증
- 이메일 인증 링크 결과 화면 처리

### US-FE-2 (P1): 로그인/로그아웃 및 보호 라우트
- 로그인 폼, 세션 유지 UX
- 미인증 사용자의 보호 페이지 접근 차단

### US-FE-3 (P2): 비밀번호 재설정 화면
- 비밀번호 찾기 요청
- 토큰 기반 비밀번호 재설정

### US-FE-4 (P2): 프로필 조회/수정 화면
- 프로필 폼 표시/수정
- 이메일 변경 시 재인증 안내 UX

### US-FE-5 (P3): 계정 비활성화/삭제 요청 화면
- 경고/확인 UX
- 예약 삭제 상태 표시

## Client State Model

- 인증 상태는 `unknown | authenticated | unauthenticated | email-unverified | deactivated`로 구분한다.
- 앱 초기 진입 시 `GET /api/v1/auth/me`로 세션 상태를 복원한다.
- 보호 라우트는 `authenticated`만 통과시키고, 그 외 상태는 목적지에 따라 `login` 또는 안내 화면으로 리다이렉트한다.
- 서버 에러 응답은 화면 표시용 `uiErrorCode`로 정규화한다(원본 코드 보존).
- backend `accountState`(`PENDING_VERIFICATION | ACTIVE | LOCKED | DEACTIVATED | DELETION_SCHEDULED`)는 frontend 상태로 매핑 규칙을 가져야 한다.

## Functional Requirements

- FR-FE-001: 모든 인증 폼은 react-hook-form + Zod 기반 검증 제공
- FR-FE-002: API 실패 시 사용자 친화적 에러 메시지 표시
- FR-FE-003: 로딩/성공/실패 상태를 화면에서 명확히 구분
- FR-FE-004: 인증 상태 기반 보호 라우팅 적용
- FR-FE-005: 백엔드 계약 변경 없이 클라이언트만 독립 개선 가능 구조
- FR-FE-006: 인증 관련 API 호출은 단일 어댑터 계층으로 통합하고 화면 컴포넌트에서 직접 `fetch`를 호출하지 않는다.
- FR-FE-007: 보호 라우트 진입 시 로딩 스켈레톤과 실패 복구 동선을 제공해야 한다.
- FR-FE-008: 백엔드 에러 코드에 따른 사용자 메시지 매핑 테이블을 유지해야 한다.
- FR-FE-009: 인증 API 어댑터는 `packages/contracts-auth` 타입을 입출력 계약으로 사용해야 한다.
- FR-FE-010: 공용 계약 패키지의 타입 선언(`dist/*.d.ts`)과 프론트 타입체크가 항상 일치해야 한다.
- FR-FE-011: API 어댑터는 `API Envelope Consumption Rules`에 따라 `data/meta` 파싱 및 `X-Request-Id` 보존을 수행해야 한다.

## Frontend Acceptance Scenarios

1. 유효한 회원가입 제출 시 성공 상태와 다음 행동(이메일 인증 안내)이 명확히 표시되어야 한다.
2. 만료/무효 인증 토큰으로 `/auth/verify-email` 진입 시 재발송 동선을 제공해야 한다.
3. 미인증 사용자가 보호 라우트 접근 시 차단되고 안내 화면으로 이동해야 한다.
4. 로그인 성공 시 보호 라우트 접근이 즉시 가능해야 하며, 새로고침 후에도 세션이 복원되어야 한다.
5. 비밀번호 재설정 성공 후 동일 토큰 재사용 시 실패 상태와 재요청 동선을 제공해야 한다.
6. 계정 비활성화 성공 시 현재 세션이 정리되고 로그인 화면으로 이동해야 한다.

## Testability Requirements (Mandatory)

- TR-FE-001: 단위 테스트 명령(`form validation`, `api adapter`, `route guard`)이 정의되어야 한다.
- TR-FE-002: 통합 테스트 명령(주요 화면 + 모의 API)이 정의되어야 한다.
- TR-FE-003: E2E 테스트 명령(회원가입/로그인/재설정/보호 라우트)이 정의되어야 한다.
- TR-FE-004: CI에서 최소 `typecheck + lint + unit + integration` 파이프라인이 동작해야 한다.
- TR-FE-005: 공용 계약 업데이트 시 frontend typecheck가 계약 위반을 검출해야 한다.
- TR-FE-006: frontend CI/typecheck는 `@packages/contracts-auth build` 이후 실행되어야 한다.
- TR-FE-007: API 어댑터 테스트에서 성공/실패 envelope 파싱 및 `X-Request-Id` 보존 검증이 포함되어야 한다.

## Definition of Done

- P1/P2 화면 요구사항이 구현과 문서 간 불일치 없이 반영된다.
- API 매핑 섹션과 백엔드 `contracts/*.md` 간 불일치가 없다.
- 공용 계약(`packages/contracts-auth`)과 프론트 API 어댑터 간 타입 불일치가 없다.
- envelope 파싱(`data/meta`)과 에러 정규화(`code/message/details`)가 어댑터 테스트로 검증된다.
- 보호 라우트/오류 복구/로딩 상태에 대한 테스트가 존재한다.
- 접근성(키보드 탐색, label 연결, 오류 안내)이 주요 폼에서 검증된다.
- 문서화된 테스트 명령으로 로컬과 CI에서 실행 가능하다.

## Non-Functional Requirements

- NFR-FE-001: 모바일/데스크톱 반응형 지원
- NFR-FE-002: 주요 인증 플로우 접근성(키보드/라벨) 준수
- NFR-FE-003: 네트워크 오류 시 재시도/복구 동선 제공

## Out of Scope

- 백엔드 엔드포인트/도메인 규칙 변경
- 인증 토큰 및 세션 저장 로직의 서버 구현
- 소셜 로그인(OAuth) 및 MFA 도입

## Dependencies

- 선행 스펙: `specs/02-email-auth-backend/spec.md`
- 기존 통합본: `specs/02-email-auth-user-management/spec.md`
