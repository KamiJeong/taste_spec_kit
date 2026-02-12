# User API Contract (v1)

Base Path: `/api/v1/users`

## Endpoints

1. `GET /profile`
2. `PATCH /profile`
3. `POST /change-password`
4. `POST /deactivate`
5. `POST /request-deletion`
6. `POST /cancel-deletion`

## Access Rule

- 모든 엔드포인트는 인증된 세션이 필요하다.

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
  - res: 비활성화 완료 + 세션 무효화
- `POST /request-deletion`
  - req: `password`
  - res: 삭제 예약 완료 (`scheduledDeletionAt`)
- `POST /cancel-deletion`
  - req: 없음
  - res: 삭제 예약 취소 완료

