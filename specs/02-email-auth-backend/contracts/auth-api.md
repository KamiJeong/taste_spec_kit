# Auth API Contract (v1)

Base Path: `/api/v1/auth`

## Transport Position

- 본 문서는 v1 REST 공식 계약이다.
- GraphQL은 선택적 adapter이며, 동일한 Auth Application Service를 호출해야 한다.
- GraphQL 추가 시에도 에러 코드/보안 규칙은 본 계약을 따른다.

## Endpoints

1. `POST /signup`
2. `GET /verify-email`
3. `POST /resend-verification`
4. `POST /login`
5. `POST /logout`
6. `GET /me`
7. `POST /forgot-password`
8. `POST /reset-password`

## Common Rules

- Content-Type: `application/json` (`verify-email` 제외)
- 모든 응답은 `X-Request-Id` 헤더를 포함한다.
- 성공 응답은 `{ success: true, data, meta? }` 형태를 사용한다.
- 실패 응답은 `{ success: false, code, message, details? }` 형태를 사용한다.
- 인증 실패 시 상세 내부 사유는 노출하지 않는다.
- 서버 시간 기준 비교가 필요한 응답은 `meta.serverTime`(ISO-8601 UTC)을 포함할 수 있다.
- `POST /resend-verification`, `POST /forgot-password`는 idempotent 정책(쿨다운/중복 억제)을 적용한다.
- 세션이 필요한 상태 변경 요청(`POST /logout`)은 CSRF 검증 헤더(`x-csrf-token`)를 요구한다.

## Request/Response (Summary)

- `POST /signup`
  - req: `email`, `password`, `name?`
  - res: 가입 수락 + 인증 대기 상태 (`accountState: PENDING_VERIFICATION`)
- `GET /verify-email`
  - query: `token`
  - res: 이메일 인증 완료 (`accountState: ACTIVE`)
- `POST /resend-verification`
  - req: `email`
  - res: 재발송 수락(쿨다운 중에도 동일 성공 형태 반환 가능)
- `POST /login`
  - req: `email`, `password`
  - res: 세션 생성 + 사용자 요약
- `POST /logout`
  - req: 없음 (세션 쿠키)
  - res: 세션 무효화
- `GET /me`
  - req: 없음 (세션 쿠키)
  - res: 현재 사용자 정보
- `POST /forgot-password`
  - req: `email`
  - res: 요청 수락(이메일 존재 여부 비노출, 중복 요청은 idempotent 처리)
- `POST /reset-password`
  - req: `token`, `newPassword`
  - res: 비밀번호 변경 완료
