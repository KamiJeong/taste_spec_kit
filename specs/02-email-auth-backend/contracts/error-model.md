# Error Model (v1)

## Response Shape

```json
{
  "success": false,
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "이메일 또는 비밀번호가 올바르지 않습니다"
}
```

## Standard Codes

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_EMAIL_NOT_VERIFIED`
- `AUTH_ACCOUNT_LOCKED`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_TOKEN_INVALID`
- `AUTH_SESSION_REQUIRED`
- `USER_EMAIL_ALREADY_EXISTS`
- `USER_ACCOUNT_DEACTIVATED`
- `VALIDATION_ERROR`
- `INTERNAL_SERVER_ERROR`

## Security Rules

- 로그인 실패 시 `AUTH_INVALID_CREDENTIALS`로 통합
- 비밀번호 찾기/재설정 요청은 이메일 존재 여부를 노출하지 않음
- 내부 예외 메시지는 `INTERNAL_SERVER_ERROR`로 마스킹

