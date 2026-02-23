Tech-Stack: specs/00-tech-stack.md

# Feature Specification: Email Auth Backend

**Feature Branch**: `spec/02-email-auth-backend`  
**Created**: 2026-02-12  
**Updated**: 2026-02-23  
**Status**: Refined (Gate 5+ In Progress)  
**Input**: 기존 `02-email-auth-user-management`에서 Backend 범위만 분리

## Tech Stack Reference Rule

- 본 문서의 런타임/라이브러리/버전 결정은 `specs/00-tech-stack.md`를 SSOT로 따른다.
- 충돌 시 본 문서보다 `specs/00-tech-stack.md`를 우선한다.

## History

- 폴더: [`history/`](./history/)
- 오늘 이력: [`history/2026-02-23.md`](./history/2026-02-23.md)

## Implementation Status Note (2026-02-23)

- 본 문서는 백엔드 목표 계약/요구사항의 기준 문서다.
- 현재 저장소 실행 코드 상태와 본 문서의 완료 조건은 분리해서 관리한다.
- 구현 완료 여부는 `tasks.md`의 체크 상태와 CI 실행 결과를 단일 기준으로 판단한다.
- 현재 Gate 3/4(P1/P2) 범위는 구현 및 테스트가 통과된 상태이며, Gate 5/6 항목을 진행 중이다.

## Scope

이 스펙은 서버 측 인증/회원관리 로직만 다룬다.

- 포함: 회원가입, 이메일 인증, 로그인/로그아웃, 비밀번호 재설정, 프로필 API, 계정 비활성화 API, 인증 로그
- 포함: PostgreSQL/Redis/BullMQ/better-auth 연동, DTO/Validation, 보안 정책
- 제외: 폼 UI, 페이지 라우팅, UX 문구/상태 표시, 클라이언트 상태관리

## Local Development Environment (Mandatory)

- 로컬 환경 변수는 `.env.template`(루트/앱 템플릿) 기반으로 구성한다.
- 로컬 인프라는 `docker-compose.yml`을 기준으로 PostgreSQL/Redis를 실행한다.
- 기본 로컬 자격:
  - PostgreSQL: `kami` / `ilovekami`
  - Redis password: `ilovekami`
- prod/stage/dev 서버의 실제 민감 정보는 저장소에 기록하지 않는다.

## Domain State Model (Mandatory)

- 계정 상태는 `PENDING_VERIFICATION | ACTIVE | LOCKED | DEACTIVATED | DELETION_SCHEDULED`로 관리한다.
- `signup` 직후 기본 상태는 `PENDING_VERIFICATION`이며 `verify-email` 성공 시 `ACTIVE`로 전이한다.
- `login` 실패 누적 정책(FR-BE-004)에 의해 `LOCKED` 전이가 가능하며 잠금 만료 후 `ACTIVE`로 자동 복귀한다.
- `deactivate` 성공 시 `DEACTIVATED`로 전이하고 모든 세션을 즉시 만료한다.
- `request-deletion` 성공 시 `DELETION_SCHEDULED` 전이 및 `scheduledDeletionAt`를 기록한다.
- `cancel-deletion` 성공 시 `ACTIVE`로 복귀한다(단, 비활성화 계정은 취소 불가).

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

## API Transport Strategy

- v1 기본 전송 계층은 REST(`HTTP + JSON + Cookie Session`)로 고정한다.
- 인증/세션/비밀번호 변경과 같이 보안 민감한 흐름은 REST 계약을 단일 진실 원천(SoT)으로 관리한다.
- GraphQL은 v1 범위에서 필수 구현 대상이 아니다.
- GraphQL이 필요해지면 v1.1+에서 `AuthGqlModule`(adapter)만 추가하고, 기존 도메인 서비스(Auth/User use-case)는 재사용한다.
- REST/GraphQL 모두 저장소 접근을 직접 하지 않고 Application Service를 통해서만 도메인 로직을 실행한다.

## API Response Envelope & Headers (v1)

- 성공 응답은 `{ success: true, data, meta? }` 형태를 사용한다.
- 실패 응답은 `{ success: false, code, message, details? }` 형태를 사용한다.
- 모든 응답은 추적 가능한 `X-Request-Id` 헤더를 포함해야 한다.
- 서버 시간 기준 비교가 필요한 흐름(잠금/만료)은 `meta.serverTime`(ISO-8601 UTC)을 반환할 수 있어야 한다.

## Contract Versioning & Compatibility

- v1 계약 변경은 `contracts/*.md`를 단일 진실 원천(SoT)으로 먼저 갱신한 뒤 구현을 변경한다.
- 응답 스키마는 하위 호환(additive) 변경을 기본 원칙으로 하며, 파괴적 변경은 v2로 분리한다.
- 에러 코드는 클라이언트 복구 동선을 위해 안정적으로 유지한다(동일 의미의 코드 재사용 금지).

## Shared Contract Model (Backend/Frontend)

- 공용 계약은 `packages/contracts-auth` 패키지로 분리한다.
- 패키지는 DTO/응답/에러 코드의 `zod schema`와 `inferred TypeScript type`만 포함한다.
- 도메인 엔티티/Repository 타입/ORM 모델은 공용 패키지로 내보내지 않는다.
- 백엔드는 입력 검증과 응답 직렬화 시 공용 스키마를 사용해 계약 준수를 강제한다.
- 계약 변경 순서: `contracts/*.md` -> `packages/contracts-auth` -> backend/frontend 구현.
- `packages/contracts-auth`의 소스 코드는 TypeScript(`src/*.ts`)로 작성하고, 런타임 소비는 빌드 산출물(`dist/*`)을 사용한다.

## NestJS Module Decomposition (Required)

아래 모듈 경계를 기준으로 구성한다.

- `AppModule`: 루트 조립. 환경설정/글로벌 파이프/인터셉터/필터 연결.
- `AuthModule`: 회원가입/로그인/로그아웃/이메일인증/비밀번호재설정 유스케이스.
- `UserModule`: 프로필 조회/수정, 비밀번호 변경, 비활성화/삭제예약 유스케이스.
- `SessionModule`: Redis 세션 생성/조회/폐기, 동시세션 정책.
- `TokenModule`: 이메일인증/재설정 토큰 발급/검증/회수(1회 사용 보장).
- `MailModule`: 메일 발송 인터페이스 및 템플릿 정책.
- `QueueModule`: BullMQ queue/worker, 재시도/백오프 정책.
- `AuditLogModule`: AuthLog 기록 및 조회(운영/감사 목적).
- `PersistenceModule`: Drizzle 스키마/리포지토리 구현(PostgreSQL).
- `SharedModule`: DTO/Zod 스키마, 공통 에러, 가드/데코레이터, 유틸.

## Module Boundary Rules

- Controller/Resolver -> Application Service -> Domain/Repository 순서만 허용한다.
- 모듈 간 직접 DB 접근을 금지한다. 저장소는 소유 모듈을 통해서만 접근한다.
- `AuthModule`과 `UserModule`은 서로의 내부 구현을 직접 참조하지 않고 공개된 Use-case 인터페이스만 참조한다.
- Queue/Mail/Audit는 사이드이펙트 계층으로 분리하고 트랜잭션 경계 밖에서 처리한다.

## Persistence/Session Runtime Rule (Mandatory)

- `PersistenceModule`은 PostgreSQL + Drizzle를 기본 런타임으로 사용해야 한다.
- `SessionModule`은 Redis를 기본 런타임으로 사용해야 한다.
- 통합/E2E/프로덕션 실행에서는 in-memory fallback을 허용하지 않는다.
- 단위 테스트에서만 명시적 테스트 더블로 in-memory 모의를 허용한다.
- Drizzle 스키마 변경은 `drizzle-kit generate` -> `drizzle-kit migrate` 절차로 관리한다.

## Security Baseline (Required)

- 세션 쿠키는 `HttpOnly`, `Secure(https)`, `SameSite=Lax`를 기본값으로 사용한다.
- 상태 변경 API(`POST`, `PATCH`)는 CSRF 방어 전략(토큰 또는 same-site 엄격 정책)을 명시적으로 적용한다.
- 인증 관련 엔드포인트는 IP+계정 기준 레이트리밋을 적용한다(로그인/재설정/인증메일 재발송 우선).
- 비밀번호 정책은 최소 길이/복잡도 규칙을 적용하고, 정책 불일치 시 `VALIDATION_ERROR`로 응답한다.
- 토큰은 평문 저장을 금지하고 해시 저장 후 비교한다.
- `resend-verification`, `forgot-password`는 반복 요청에 대해 부작용을 제한하는 idempotent 처리(쿨다운/중복 억제)를 적용한다.

## Audit Log Minimum Schema

- 최소 필드: `eventId`, `eventType`, `userId?`, `email?`, `ip`, `userAgent`, `result`, `reasonCode?`, `occurredAt`.
- 이벤트는 `AUTH_SIGNUP`, `AUTH_VERIFY_EMAIL`, `AUTH_LOGIN`, `AUTH_LOGOUT`, `AUTH_RESET_PASSWORD`, `USER_DEACTIVATE`를 포함해야 한다.
- 민감정보(비밀번호/토큰 원문)는 로그 저장을 금지한다.

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
- FR-BE-009: NestJS 모듈은 본 문서의 Module Decomposition/Boundary Rules를 준수해야 한다.
- FR-BE-010: REST를 v1 공식 계약으로 유지하고 GraphQL은 adapter 계층으로만 추가 가능해야 한다.
- FR-BE-011: `contracts/*.md` 변경 시 `specs/03-email-auth-frontend/spec.md`의 API 매핑 섹션과 동기화되어야 한다.
- FR-BE-012: 계정 상태 전이 규칙은 `Domain State Model`을 준수해야 한다.
- FR-BE-013: Security Baseline의 쿠키/CSRF/레이트리밋/토큰 저장 규칙을 준수해야 한다.
- FR-BE-014: API 요청/응답/에러 코드는 `packages/contracts-auth` 공용 계약과 일치해야 한다.
- FR-BE-015: 모든 API 응답은 `API Response Envelope & Headers` 규칙을 준수해야 한다.
- FR-BE-016: `resend-verification`, `forgot-password`는 idempotent 정책(중복 억제/쿨다운)을 준수해야 한다.
- FR-BE-017: 감사 로그는 `Audit Log Minimum Schema`를 준수해야 한다.
- FR-BE-018: `packages/contracts-auth`는 TypeScript source + declaration 출력(`dist/*.d.ts`)을 유지해야 한다.
- FR-BE-019: 통합/E2E/프로덕션 환경에서 Postgres/Redis 미연결 상태로 서버를 정상 기동시키지 않는다(in-memory fallback 금지).
- FR-BE-020: 로컬 개발환경은 `.env.template` + `docker-compose.yml` 기반으로 재현 가능해야 하며, 실서버 민감정보를 저장소에 포함하지 않는다.

## Backend Acceptance Scenarios

1. 회원가입 성공 시 사용자 레코드 생성, 이메일 인증 토큰 생성, 인증 메일 큐 적재가 모두 성공해야 한다.
2. 인증 토큰 만료 또는 재사용 시 명시적 에러 코드로 거부되어야 한다.
3. 미인증 계정 로그인 요청은 세션 미생성 상태로 거부되어야 한다.
4. 로그인 5회 실패 시 15분 잠금이 적용되고 잠금 기간 중 로그인은 거부되어야 한다.
5. 비밀번호 재설정 성공 시 기존 재설정 토큰은 즉시 무효화되어야 한다.
6. 계정 비활성화 후 로그인은 차단되어야 하며 기존 세션은 무효화되어야 한다.
7. 모든 인증 이벤트는 AuthLog에 누락 없이 기록되어야 한다.
8. 성공/실패 응답 모두 `X-Request-Id`를 포함하고, `meta.serverTime`가 규칙에 맞게 제공되어야 한다.
9. `resend-verification`/`forgot-password` 반복 요청은 idempotent 정책(쿨다운/중복 억제)에 따라 일관되게 처리되어야 한다.

## Non-Functional Requirements

- NFR-BE-001: 로그인 요청 P95 500ms 이내
- NFR-BE-002: API 에러 응답 포맷 일관성 유지
- NFR-BE-003: 로컬(Docker Compose)에서 동일하게 재현 가능
- NFR-BE-004: 인증 핵심 엔드포인트 에러율(5xx) 1% 미만 유지
- NFR-BE-005: 감사 로그 누락률 0% 목표(기록 실패 시 경고 알림)

## Testability Requirements (Mandatory)

- TR-BE-001: 단위 테스트 실행 명령이 정의되어야 한다.
- TR-BE-002: 통합 테스트는 PostgreSQL/Redis를 동시에 사용하는 실행 경로(실컨테이너 또는 Testcontainer) 명령이 정의되어야 한다.
- TR-BE-003: 인증 핵심 플로우 E2E 테스트 실행 명령이 정의되어야 한다.
- TR-BE-004: CI에서 최소 `typecheck + lint + unit + integration` 파이프라인이 동작해야 한다.
- TR-BE-005: 로컬에서 `.env.test` 기준으로 재현 가능한 테스트 데이터 초기화 절차가 있어야 한다.
- TR-BE-006: 상태 전이 테스트(`PENDING_VERIFICATION -> ACTIVE`, `ACTIVE -> DEACTIVATED`)가 포함되어야 한다.
- TR-BE-007: 보안 회귀 테스트(CSRF 방어, 레이트리밋, 토큰 재사용 차단)가 포함되어야 한다.
- TR-BE-008: 계약 테스트에서 공용 스키마 기반 직렬화/역직렬화 검증이 포함되어야 한다.
- TR-BE-009: 응답 Envelope/헤더(`X-Request-Id`, `meta.serverTime`) 검증 테스트가 포함되어야 한다.
- TR-BE-010: idempotent 처리(재전송/재요청 쿨다운) 검증 테스트가 포함되어야 한다.
- TR-BE-011: 감사 로그 최소 스키마 필드 검증 테스트가 포함되어야 한다.
- TR-BE-012: `@packages/contracts-auth build`가 성공하고 backend 테스트에서 해당 빌드 산출물을 실제 사용해야 한다.
- TR-BE-013: Drizzle migration 명령(`generate`, `migrate`)이 문서화되고 로컬에서 실행 가능해야 한다.
- TR-BE-014: 통합/E2E 실행 시 `DATABASE_URL`/`REDIS_URL` 누락 또는 미연결 상태를 실패로 감지하는 검증이 포함되어야 한다.

## Definition of Done

- P1/P2 API 계약이 `contracts/*.md`와 구현 간 불일치가 없다.
- 기능/보안 요구사항(FR-BE-001~020) 검증 테스트가 존재한다.
- 모듈 경계(FR-BE-009) 위반이 없다.
- 실패 케이스(만료 토큰, 중복 이메일, 잠금 계정) 테스트가 존재한다.
- 테스트 스위트가 문서화된 명령으로 실제 실행 가능하다.
- 상태 전이(FR-BE-012) 및 Security Baseline(FR-BE-013) 검증 테스트가 존재한다.
- 공용 계약 패키지 빌드/타입 선언(FR-BE-018, TR-BE-012)이 CI/로컬에서 재현 가능하다.
- Drizzle migration 절차(TR-BE-013)와 인프라 연결 실패 감지(TR-BE-014)가 테스트/문서로 재현 가능하다.

## Out of Scope

- 회원가입/로그인 화면 UI 구현
- 프론트 라우트 보호 미들웨어
- 토스트/폼 실시간 검증 UX
- GraphQL 스키마/리졸버의 초기 릴리즈 강제

## Dependencies

- 참고 스펙: `specs/03-email-auth-frontend/spec.md`
- 기존 통합본: `specs/02-email-auth-user-management/spec.md`
