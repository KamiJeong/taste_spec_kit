Tech-Stack: specs/00-tech-stack.md

# Feature Specification: API Docs with Swagger

**Feature Branch**: `feature/api-docs-swagger`  
**Created**: 2026-03-04  
**Updated**: 2026-03-04  
**Status**: Refined  
**Input**: "api docs with swagger"

## Tech Stack Reference Rule

- 본 문서의 런타임/라이브러리/버전 결정은 `specs/00-tech-stack.md`를 SSOT로 따른다.
- 충돌 시 본 문서보다 `specs/00-tech-stack.md`를 우선한다.

## Scope

- 포함: `apps/api` NestJS 런타임에 OpenAPI 문서 생성 및 Swagger UI 제공
- 포함: 인증/유저 핵심 엔드포인트 문서화(요청/응답/에러)
- 포함: 운영 환경에서 문서 엔드포인트 접근 제어 정책
- 제외: 프론트엔드 문서 포털 구축
- 제외: OpenAPI 기반 SDK 자동 생성

## Runtime Documentation Policy (Mandatory)

- Swagger 문서는 서버 코드(`apps/api/src/main.ts`, 각 controller decorator)로부터 생성되는 결과를 기준으로 한다.
- 수동 작성된 외부 OpenAPI 파일을 SSOT로 사용하지 않는다.
- API 계약 변경 시 controller 문서와 테스트를 같은 변경셋에서 동기화한다.

## Docs Exposure Environment Contract (Mandatory)

- `API_DOCS_ENABLED`:
  - `true`: `/api/docs`, `/api-json` 노출
  - `false`: docs endpoint 비노출
- `API_DOCS_PROTECTED`:
  - `true`: 보호 정책(예: 인증/키 확인) 적용 가능 상태
  - `false`: 보호 정책 미적용
- 기본 정책:
  - `NODE_ENV=development`: `API_DOCS_ENABLED=true`, `API_DOCS_PROTECTED=false`
  - `NODE_ENV=production`: `API_DOCS_ENABLED=false` 기본값

## API Surface (v1)

- `/api/v1/auth/signup` `POST`
- `/api/v1/auth/verify-email` `GET`
- `/api/v1/auth/resend-verification` `POST`
- `/api/v1/auth/forgot-password` `POST`
- `/api/v1/auth/reset-password` `POST`
- `/api/v1/auth/login` `POST`
- `/api/v1/auth/logout` `POST`
- `/api/v1/auth/me` `GET`
- `/api/v1/users/profile` `GET`
- `/api/v1/users/profile` `PATCH`
- `/api/v1/users/change-password` `POST`
- `/api/v1/users/deactivate` `POST`
- `/api/v1/users/request-deletion` `POST`
- `/api/v1/users/cancel-deletion` `POST`

## Requirements

- **FR-SW-001**: 서버 기동 시 OpenAPI 문서가 생성되어야 한다.
- **FR-SW-002**: Swagger UI는 `/api/docs` 경로에서 접근 가능해야 한다.
- **FR-SW-003**: OpenAPI 문서는 `API Surface (v1)`의 엔드포인트를 포함해야 한다.
- **FR-SW-004**: 요청/응답 스키마는 현재 API Envelope 규칙(`{ success, data/meta }`, `{ success, code, message, details }`)과 일치해야 한다.
- **FR-SW-005**: 인증이 필요한 엔드포인트는 Swagger에서 쿠키 기반 인증(`sid`)과 CSRF 헤더(`x-csrf-token`) 요구를 명시해야 한다.
- **FR-SW-006**: OpenAPI JSON은 `/api-json` 경로에서 접근 가능해야 한다.
- **FR-SW-007**: 프로덕션 환경에서는 문서 엔드포인트 접근 제어(비활성 또는 보호)가 가능해야 한다.
- **FR-SW-008**: 문서화 구성은 `specs/00-tech-stack.md`의 NestJS/TypeScript 기준과 충돌하지 않아야 한다.
- **FR-SW-009**: 본 기능의 `spec.md`, `plan.md`, `tasks.md`는 `Tech-Stack: specs/00-tech-stack.md`를 포함해야 한다.
- **FR-SW-010**: docs 노출 제어는 `API_DOCS_ENABLED`, `API_DOCS_PROTECTED` 환경 변수 계약을 따라야 한다.

## Acceptance Scenarios

1. 개발 환경에서 API 서버를 실행하면 `/api/docs`에서 Swagger UI가 열려야 한다.
2. `/api-json` 응답에는 OpenAPI 문서와 auth/user v1 경로가 포함되어야 한다.
3. 인증 필요 엔드포인트는 보안 요구사항(`sid` cookie, `x-csrf-token`)이 문서에 드러나야 한다.
4. 프로덕션 모드에서 문서 노출 제어 플래그에 따라 docs endpoint가 비활성/보호 동작해야 한다.

## Non-Functional Requirements

- **NFR-SW-001**: Swagger 문서 활성화 상태가 기존 API 응답 동작(상태 코드/헤더/바디)에 회귀를 만들지 않아야 한다.
- **NFR-SW-002**: 문서 endpoint 비활성 정책은 프로세스 재시작 없이 런타임 변경을 요구하지 않는다(기동 시 env 기준 결정).
- **NFR-SW-003**: 문서 생성 실패 시 서버는 기동 단계에서 명시적 오류를 기록하고 실패해야 한다.

## Testability Requirements (Mandatory)

- **TR-SW-001**: `/api/docs` 접근 가능 여부를 검증하는 e2e 또는 통합 테스트가 있어야 한다.
- **TR-SW-002**: `/api-json` payload에 `openapi` 버전과 auth/user 경로 포함 여부를 검증하는 테스트가 있어야 한다.
- **TR-SW-003**: production 노출 제어 플래그 on/off에 대한 테스트 케이스가 있어야 한다.
- **TR-SW-004**: 문서화 관련 변경은 `apps/api` 테스트 명령 체계 내에서 재현 가능해야 한다.
- **TR-SW-005**: `API_DOCS_ENABLED/API_DOCS_PROTECTED` 조합별 동작이 최소 1개 이상 검증되어야 한다.

## Success Criteria

- **SC-SW-001**: 로컬 실행 시 `/api/docs`에서 Swagger UI가 정상 렌더링된다.
- **SC-SW-002**: `/api-json`(또는 동등 경로)에서 OpenAPI JSON을 조회할 수 있다.
- **SC-SW-003**: 문서에 auth/user 핵심 엔드포인트 및 스키마가 누락 없이 표시된다.
- **SC-SW-004**: 프로덕션 모드에서 문서 엔드포인트 보호 정책이 의도대로 동작한다.

## Definition of Done

- FR-SW-001~010 충족
- NFR-SW-001~003 충족
- TR-SW-001~005 충족
- Swagger 문서와 실제 라우트의 핵심 동작 불일치가 없음
