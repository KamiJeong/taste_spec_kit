# User API Contract (v1)

Base Path: `/api/v1/users`

## Transport Position

- 본 문서는 v1 REST 공식 계약이다.
- GraphQL은 v1 범위에서 필수 아님. 필요 시 `UserModule` use-case를 재사용하는 adapter로만 추가한다.

## Endpoints

1. `GET /profile`
2. `PATCH /profile`
3. `POST /change-password`
4. `POST /deactivate`
5. `POST /request-deletion`
6. `POST /cancel-deletion`

## Access Rule

- 모든 엔드포인트는 인증된 세션이 필요하다.

## Common Rules

- 모든 응답은 `X-Request-Id` 헤더를 포함한다.
- 성공 응답은 `{ success: true, data, meta? }` 형태를 사용한다.
- 실패 응답은 `{ success: false, code, message, details? }` 형태를 사용한다.
- 서버 시간 기준 비교가 필요한 응답은 `meta.serverTime`(ISO-8601 UTC)을 포함할 수 있다.
- 상태 변경 요청(`PATCH/POST`)은 CSRF 검증 헤더(`x-csrf-token`)를 요구한다.

## Request/Response (Summary)

- `GET /profile`
  - res: `id`, `email`, `name`, `emailVerified`, `createdAt`
- `PATCH /profile`
  - req: `name?`, `email?`
  - res: 프로필 수정 결과
- `POST /change-password`
  - req: `currentPassword`, `newPassword`
  - res: 변경 완료
- `POST /deactivate`
  - req: `password`
  - res: 비활성화 완료 + 세션 무효화 (`accountState: DEACTIVATED`)
- `POST /request-deletion`
  - req: `password`
  - res: 삭제 예약 완료 (`accountState: DELETION_SCHEDULED`, `scheduledDeletionAt`)
- `POST /cancel-deletion`
  - req: 없음
  - res: 삭제 예약 취소 완료 (`accountState: ACTIVE`)
