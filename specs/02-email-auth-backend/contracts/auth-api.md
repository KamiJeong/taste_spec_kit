# Auth API Contract (v1)

Base Path: `/api/v1/auth`

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
- 성공 응답은 `success: true`를 포함한다.
- 실패 응답은 `success: false`, `code`, `message`를 포함한다.
- 인증 실패 시 상세 내부 사유는 노출하지 않는다.

## Request/Response (Summary)

- `POST /signup`
  - req: `email`, `password`, `name?`
  - res: 가입 수락 + 인증 대기 상태
- `GET /verify-email`
  - query: `token`
  - res: 이메일 인증 완료
- `POST /resend-verification`
  - req: `email`
  - res: 재발송 수락
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
  - res: 요청 수락(이메일 존재 여부 비노출)
- `POST /reset-password`
  - req: `token`, `newPassword`
  - res: 비밀번호 변경 완료

