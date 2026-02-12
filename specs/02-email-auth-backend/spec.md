# Feature Specification: Email Auth User Management (Backend)

**Feature Branch**: `spec/02-email-auth-backend`  
**Created**: 2026-02-12  
**Status**: Draft  
**Input**: 기존 `02-email-auth-user-management`에서 Backend 범위만 분리

## Scope

이 스펙은 서버 측 인증/회원관리 로직만 다룬다.

- 포함: 회원가입, 이메일 인증, 로그인/로그아웃, 비밀번호 재설정, 프로필 API, 계정 비활성화 API, 인증 로그
- 포함: PostgreSQL/Redis/BullMQ/better-auth 연동, DTO/Validation, 보안 정책
- 제외: 폼 UI, 페이지 라우팅, UX 문구/상태 표시, 클라이언트 상태관리

## API Surface (v1)

- `/api/v1/auth/signup` `POST`
- `/api/v1/auth/verify-email` `GET`
- `/api/v1/auth/resend-verification` `POST`
- `/api/v1/auth/login` `POST`
- `/api/v1/auth/logout` `POST`
- `/api/v1/auth/me` `GET`
- `/api/v1/auth/forgot-password` `POST`
- `/api/v1/auth/reset-password` `POST`
- `/api/v1/users/profile` `GET`
- `/api/v1/users/profile` `PATCH`
- `/api/v1/users/change-password` `POST`
- `/api/v1/users/deactivate` `POST`
- `/api/v1/users/request-deletion` `POST`
- `/api/v1/users/cancel-deletion` `POST`

## User Stories

### US-BE-1 (P1): 이메일 회원가입 및 이메일 인증 API
- `POST /api/v1/auth/signup`
- `GET /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`

### US-BE-2 (P1): 이메일/비밀번호 로그인 및 세션 API
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### US-BE-3 (P2): 비밀번호 재설정 API
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

### US-BE-4 (P2): 프로필 조회/수정 API
- `GET /api/v1/users/profile`
- `PATCH /api/v1/users/profile`
- `POST /api/v1/users/change-password`

### US-BE-5 (P3): 계정 비활성화/삭제 예약 API
- `POST /api/v1/users/deactivate`
- `POST /api/v1/users/request-deletion`
- `POST /api/v1/users/cancel-deletion`

## Functional Requirements

- FR-BE-001: 비밀번호는 Argon2id로 해시 저장
- FR-BE-002: 이메일 인증 전 로그인 차단
- FR-BE-003: 인증/재설정 토큰 만료 및 1회 사용 보장
- FR-BE-004: 로그인 실패 5회/15분 계정 잠금
- FR-BE-005: 세션은 Redis 기반 서버 세션으로 관리
- FR-BE-006: 보안상 인증 실패 상세 사유 노출 제한
- FR-BE-007: 인증 이벤트(AuthLog) 100% 기록
- FR-BE-008: 모든 엔드포인트는 Zod + DTO 기반 검증

## Backend Acceptance Scenarios

1. 회원가입 성공 시 사용자 레코드 생성, 이메일 인증 토큰 생성, 인증 메일 큐 적재가 모두 성공해야 한다.
2. 인증 토큰 만료 또는 재사용 시 명시적 에러 코드로 거부되어야 한다.
3. 미인증 계정 로그인 요청은 세션 미생성 상태로 거부되어야 한다.
4. 로그인 5회 실패 시 15분 잠금이 적용되고 잠금 기간 중 로그인은 거부되어야 한다.
5. 비밀번호 재설정 성공 시 기존 재설정 토큰은 즉시 무효화되어야 한다.
6. 계정 비활성화 후 로그인은 차단되어야 하며 기존 세션은 무효화되어야 한다.
7. 모든 인증 이벤트는 AuthLog에 누락 없이 기록되어야 한다.

## Non-Functional Requirements

- NFR-BE-001: 로그인 요청 P95 500ms 이내
- NFR-BE-002: API 에러 응답 포맷 일관성 유지
- NFR-BE-003: 로컬(Docker Compose)에서 동일하게 재현 가능

## Testability Requirements (Mandatory)

- TR-BE-001: 단위 테스트 실행 명령이 정의되어야 한다.
- TR-BE-002: 통합 테스트(실 DB/Redis 또는 Testcontainer) 실행 명령이 정의되어야 한다.
- TR-BE-003: 인증 핵심 플로우 E2E 테스트 실행 명령이 정의되어야 한다.
- TR-BE-004: CI에서 최소 `typecheck + lint + unit + integration` 파이프라인이 동작해야 한다.
- TR-BE-005: 로컬에서 `.env.test` 기준으로 재현 가능한 테스트 데이터 초기화 절차가 있어야 한다.

## Definition of Done

- P1/P2 API 계약이 `contracts/*.md`와 구현 간 불일치가 없다.
- 보안 요구사항(FR-BE-001~008) 검증 테스트가 존재한다.
- 실패 케이스(만료 토큰, 중복 이메일, 잠금 계정) 테스트가 존재한다.
- 테스트 스위트가 문서화된 명령으로 실제 실행 가능하다.

## Out of Scope

- 회원가입/로그인 화면 UI 구현
- 프론트 라우트 보호 미들웨어
- 토스트/폼 실시간 검증 UX

## Dependencies

- 참고 스펙: `specs/03-email-auth-frontend/spec.md`
- 기존 통합본: `specs/02-email-auth-user-management/spec.md`
