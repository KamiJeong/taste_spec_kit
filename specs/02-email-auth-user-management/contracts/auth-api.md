# API Contracts: Authentication Endpoints

**Feature**: 002-email-auth-user-management  
**API Style**: REST  
**Base URL**: `/api/v1/auth`

---

## POST /signup

회원가입 엔드포인트 - 새로운 사용자 계정을 생성하고 이메일 인증 링크를 발송합니다.

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  email: string;      // RFC 5322 형식, 최대 255자
  password: string;   // 최소 8자, 대소문자/숫자/특수문자 포함
  name?: string;      // 선택 사항, 최대 100자
}
```

**Example**:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "name": "홍길동"
}
```

### Response

**Success (201 Created)**:
```typescript
{
  success: true;
  data: {
    userId: string;     // UUID
    email: string;
    name?: string;
    message: string;    // "이메일 인증 링크를 발송했습니다"
  }
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "홍길동",
    "message": "이메일 인증 링크를 발송했습니다"
  }
}
```

**Errors**:
- **400 Bad Request**: 검증 실패 (이메일 형식 오류, 비밀번호 복잡도 미충족)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 값이 유효하지 않습니다",
    "details": [
      {
        "field": "password",
        "message": "비밀번호는 최소 8자 이상이어야 합니다"
      }
    ]
  }
}
```

- **409 Conflict**: 이미 가입된 이메일
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 가입된 이메일입니다"
  }
}
```

- **429 Too Many Requests**: Rate limit 초과
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요"
  }
}
```

---

## POST /login

로그인 엔드포인트 - 이메일과 비밀번호로 인증하고 세션을 생성합니다.

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Example**:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  data: {
    user: {
      id: string;           // UUID
      email: string;
      name?: string;
      emailVerified: boolean;
    };
    sessionToken: string;   // httpOnly 쿠키에도 설정됨
  }
}
```

**Set-Cookie Header**:
```
Set-Cookie: session=<token>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Example**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "홍길동",
      "emailVerified": true
    },
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors**:
- **400 Bad Request**: 검증 실패
- **401 Unauthorized**: 이메일 또는 비밀번호 오류
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다"
  }
}
```

- **403 Forbidden**: 이메일 미인증
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "이메일 인증이 필요합니다. 인증 이메일을 확인해주세요"
  }
}
```

- **403 Forbidden**: 계정 비활성화
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_INACTIVE",
    "message": "비활성화된 계정입니다"
  }
}
```

- **429 Too Many Requests**: 로그인 시도 5회 초과
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "로그인 시도 횟수 초과. 15분 후 다시 시도해주세요"
  }
}
```

---

## POST /logout

로그아웃 엔드포인트 - 현재 세션을 무효화합니다.

### Request

**Headers**:
```
Cookie: session=<token>
```

**Body**: None

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  message: string;    // "로그아웃되었습니다"
}
```

**Set-Cookie Header** (쿠키 삭제):
```
Set-Cookie: session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0
```

**Example**:
```json
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

**Errors**:
- **401 Unauthorized**: 세션 없음 또는 만료
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증이 필요합니다"
  }
}
```

---

## GET /verify-email

이메일 인증 엔드포인트 - 토큰을 검증하고 계정을 활성화합니다.

### Request

**Query Parameters**:
```
token: string   // 이메일에 포함된 인증 토큰
```

**Example**:
```
GET /api/v1/auth/verify-email?token=abc123xyz456...
```

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  message: string;    // "계정이 활성화되었습니다. 로그인해주세요"
}
```

**Example**:
```json
{
  "success": true,
  "message": "계정이 활성화되었습니다. 로그인해주세요"
}
```

**Errors**:
- **400 Bad Request**: 토큰 누락
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_REQUIRED",
    "message": "인증 토큰이 필요합니다"
  }
}
```

- **404 Not Found**: 유효하지 않은 토큰
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "유효하지 않은 인증 토큰입니다"
  }
}
```

- **410 Gone**: 토큰 만료
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "인증 링크가 만료되었습니다. 새 링크를 요청해주세요"
  }
}
```

- **409 Conflict**: 이미 인증된 계정
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_VERIFIED",
    "message": "이미 인증된 계정입니다"
  }
}
```

---

## POST /resend-verification

이메일 인증 링크 재발송 엔드포인트

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  email: string;
}
```

**Example**:
```json
{
  "email": "user@example.com"
}
```

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  message: string;    // "이메일 인증 링크를 재발송했습니다"
}
```

**Example**:
```json
{
  "success": true,
  "message": "이메일 인증 링크를 재발송했습니다"
}
```

**Errors**:
- **404 Not Found**: 등록되지 않은 이메일 (보안상 동일 메시지 반환)
```json
{
  "success": true,
  "message": "이메일 인증 링크를 재발송했습니다"
}
```

- **409 Conflict**: 이미 인증된 계정
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_VERIFIED",
    "message": "이미 인증된 계정입니다"
  }
}
```

- **429 Too Many Requests**: 재발송 요청 제한 (3회/1시간)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청이 너무 많습니다. 1시간 후 다시 시도해주세요"
  }
}
```

---

## POST /forgot-password

비밀번호 재설정 요청 엔드포인트 - 재설정 링크를 이메일로 발송합니다.

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  email: string;
}
```

**Example**:
```json
{
  "email": "user@example.com"
}
```

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  message: string;    // "비밀번호 재설정 링크를 이메일로 발송했습니다"
}
```

**Note**: 보안상 이메일 존재 여부와 관계없이 동일한 성공 메시지 반환 (이메일 열거 공격 방지)

**Example**:
```json
{
  "success": true,
  "message": "비밀번호 재설정 링크를 이메일로 발송했습니다"
}
```

**Errors**:
- **429 Too Many Requests**: 재설정 요청 제한 (3회/1시간)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청이 너무 많습니다. 1시간 후 다시 시도해주세요"
  }
}
```

---

## POST /reset-password

비밀번호 재설정 엔드포인트 - 토큰을 검증하고 새 비밀번호를 설정합니다.

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  token: string;      // 이메일에 포함된 재설정 토큰
  newPassword: string; // 최소 8자, 대소문자/숫자/특수문자 포함
}
```

**Example**:
```json
{
  "token": "abc123xyz456...",
  "newPassword": "NewSecureP@ss123"
}
```

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  message: string;    // "비밀번호가 변경되었습니다"
}
```

**Example**:
```json
{
  "success": true,
  "message": "비밀번호가 변경되었습니다"
}
```

**Errors**:
- **400 Bad Request**: 검증 실패 (비밀번호 복잡도 미충족)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "비밀번호는 최소 8자 이상이어야 합니다"
  }
}
```

- **404 Not Found**: 유효하지 않은 토큰
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "유효하지 않은 재설정 토큰입니다"
  }
}
```

- **410 Gone**: 토큰 만료 (1시간)
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "재설정 링크가 만료되었습니다. 다시 요청해주세요"
  }
}
```

---

## GET /me

현재 로그인한 사용자 정보 조회 엔드포인트

### Request

**Headers**:
```
Cookie: session=<token>
```

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  data: {
    id: string;           // UUID
    email: string;
    name?: string;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: string;    // ISO 8601 형식
    updatedAt: string;
  }
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "홍길동",
    "emailVerified": true,
    "isActive": true,
    "createdAt": "2026-02-09T10:30:00Z",
    "updatedAt": "2026-02-09T10:30:00Z"
  }
}
```

**Errors**:
- **401 Unauthorized**: 세션 없음 또는 만료
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증이 필요합니다"
  }
}
```

---

## Common Response Structure

모든 API 응답은 일관된 구조를 따릅니다:

### Success Response
```typescript
{
  success: true;
  data?: any;           // 응답 데이터 (선택 사항)
  message?: string;     // 성공 메시지 (선택 사항)
}
```

### Error Response
```typescript
{
  success: false;
  error: {
    code: string;       // 에러 코드 (UPPER_SNAKE_CASE)
    message: string;    // 사용자 친화적 에러 메시지
    details?: any;      // 추가 에러 정보 (검증 에러 등)
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | 입력 값 검증 실패 |
| TOKEN_REQUIRED | 400 | 토큰 누락 |
| UNAUTHORIZED | 401 | 인증 필요 |
| INVALID_CREDENTIALS | 401 | 잘못된 이메일/비밀번호 |
| EMAIL_NOT_VERIFIED | 403 | 이메일 인증 필요 |
| ACCOUNT_INACTIVE | 403 | 계정 비활성화 |
| INVALID_TOKEN | 404 | 유효하지 않은 토큰 |
| EMAIL_ALREADY_EXISTS | 409 | 이메일 중복 |
| ALREADY_VERIFIED | 409 | 이미 인증된 계정 |
| TOKEN_EXPIRED | 410 | 토큰 만료 |
| RATE_LIMIT_EXCEEDED | 429 | Rate limit 초과 |
| ACCOUNT_LOCKED | 429 | 로그인 시도 횟수 초과 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /signup | 10회 | 1시간 |
| POST /login | 5회 | 15분 (실패 시) |
| POST /forgot-password | 3회 | 1시간 |
| POST /resend-verification | 3회 | 1시간 |
| 기타 엔드포인트 | 60회 | 1분 |

**Rate Limit Headers**:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1707478800
```

---

## Security Headers

모든 응답에 다음 보안 헤더 포함:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

---

## CORS Policy

```
Access-Control-Allow-Origin: <FRONTEND_URL>
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Notes

- 모든 타임스탬프는 **ISO 8601** 형식 (UTC)
- 세션 토큰은 **httpOnly 쿠키**로 전송 (XSS 방지)
- 비밀번호는 **절대 응답에 포함되지 않음**
- Rate limiting은 **IP 주소 + 엔드포인트** 기준
- 에러 메시지는 **한국어** (프론트엔드에서 표시)


