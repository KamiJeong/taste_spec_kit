# API Contracts: User Profile Endpoints

**Feature**: 001-email-auth-user-management  
**API Style**: REST  
**Base URL**: `/api/v1/users`

**Authentication**: All endpoints require a valid session (Cookie: session=<token>)

---

## GET /profile

현재 로그인한 사용자의 프로필 정보를 조회합니다.

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
    createdAt: string;    // ISO 8601
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

---

## PATCH /profile

현재 로그인한 사용자의 프로필 정보를 수정합니다.

### Request

**Headers**:
```
Content-Type: application/json
Cookie: session=<token>
```

**Body**:
```typescript
{
  name?: string;        // 최대 100자
  email?: string;       // 이메일 변경 시 재인증 필요
}
```

**Example**:
```json
{
  "name": "김철수"
}
```

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  data: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message?: string;     // 이메일 변경 시: "새 이메일 주소로 인증 링크를 발송했습니다"
}
```

**Example (이름 변경)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "김철수",
    "emailVerified": true,
    "isActive": true,
    "createdAt": "2026-02-09T10:30:00Z",
    "updatedAt": "2026-02-09T11:45:00Z"
  }
}
```

**Example (이메일 변경 요청)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "김철수",
    "emailVerified": true,
    "isActive": true,
    "createdAt": "2026-02-09T10:30:00Z",
    "updatedAt": "2026-02-09T11:45:00Z"
  },
  "message": "새 이메일 주소로 인증 링크를 발송했습니다. 인증 후 변경이 완료됩니다"
}
```

**Errors**:
- **400 Bad Request**: 검증 실패
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 값이 유효하지 않습니다",
    "details": [
      {
        "field": "name",
        "message": "이름은 최대 100자까지 입력 가능합니다"
      }
    ]
  }
}
```

- **401 Unauthorized**: 세션 없음 또는 만료

- **409 Conflict**: 이메일 중복
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 사용 중인 이메일 주소입니다"
  }
}
```

---

## POST /change-password

현재 로그인한 사용자의 비밀번호를 변경합니다.

### Request

**Headers**:
```
Content-Type: application/json
Cookie: session=<token>
```

**Body**:
```typescript
{
  currentPassword: string;  // 현재 비밀번호 (확인용)
  newPassword: string;      // 새 비밀번호 (최소 8자, 복잡도 요구사항)
}
```

**Example**:
```json
{
  "currentPassword": "OldSecureP@ss123",
  "newPassword": "NewSecureP@ss456"
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

- **401 Unauthorized**: 세션 없음 또는 만료

- **403 Forbidden**: 현재 비밀번호 불일치
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "현재 비밀번호가 올바르지 않습니다"
  }
}
```

---

## POST /deactivate

현재 로그인한 사용자의 계정을 비활성화합니다.

### Request

**Headers**:
```
Content-Type: application/json
Cookie: session=<token>
```

**Body**:
```typescript
{
  password: string;     // 비밀번호 확인 (보안)
  reason?: string;      // 비활성화 이유 (선택 사항, 최대 500자)
}
```

**Example**:
```json
{
  "password": "SecureP@ss123",
  "reason": "서비스를 더 이상 이용하지 않음"
}
```

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  message: string;    // "계정이 비활성화되었습니다"
}
```

**Set-Cookie Header** (로그아웃):
```
Set-Cookie: session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0
```

**Example**:
```json
{
  "success": true,
  "message": "계정이 비활성화되었습니다"
}
```

**Errors**:
- **401 Unauthorized**: 세션 없음 또는 만료

- **403 Forbidden**: 비밀번호 불일치
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "비밀번호가 올바르지 않습니다"
  }
}
```

---

## POST /request-deletion

현재 로그인한 사용자의 계정 영구 삭제를 요청합니다. 30일 유예기간이 적용됩니다.

### Request

**Headers**:
```
Content-Type: application/json
Cookie: session=<token>
```

**Body**:
```typescript
{
  password: string;     // 비밀번호 확인 (보안)
  reason?: string;      // 삭제 이유 (선택 사항, 최대 500자)
}
```

**Example**:
```json
{
  "password": "SecureP@ss123",
  "reason": "개인정보 완전 삭제 요청"
}
```

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  message: string;    // "30일 후 계정이 영구 삭제됩니다. 기간 내 로그인하면 취소됩니다"
  data: {
    deletionScheduledAt: string;  // ISO 8601 (30일 후)
  }
}
```

**Set-Cookie Header** (로그아웃):
```
Set-Cookie: session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0
```

**Example**:
```json
{
  "success": true,
  "message": "30일 후 계정이 영구 삭제됩니다. 기간 내 로그인하면 취소됩니다",
  "data": {
    "deletionScheduledAt": "2026-03-11T10:30:00Z"
  }
}
```

**Errors**:
- **401 Unauthorized**: 세션 없음 또는 만료

- **403 Forbidden**: 비밀번호 불일치
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "비밀번호가 올바르지 않습니다"
  }
}
```

---

## POST /cancel-deletion

계정 삭제 요청을 취소합니다. (30일 유예기간 내에만 가능)

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
  message: string;    // "계정 삭제가 취소되었습니다"
}
```

**Example**:
```json
{
  "success": true,
  "message": "계정 삭제가 취소되었습니다"
}
```

**Errors**:
- **401 Unauthorized**: 세션 없음 또는 만료

- **404 Not Found**: 삭제 요청 없음
```json
{
  "success": false,
  "error": {
    "code": "NO_DELETION_REQUEST",
    "message": "삭제 요청이 없습니다"
  }
}
```

---

## GET /activity-log

현재 로그인한 사용자의 인증 활동 로그를 조회합니다.

### Request

**Headers**:
```
Cookie: session=<token>
```

**Query Parameters**:
```
page?: number       // 페이지 번호 (기본값: 1)
limit?: number      // 페이지당 항목 수 (기본값: 20, 최대: 100)
eventType?: string  // 이벤트 유형 필터 (예: LOGIN_SUCCESS)
```

**Example**:
```
GET /api/v1/users/activity-log?page=1&limit=20
```

### Response

**Success (200 OK)**:
```typescript
{
  success: true;
  data: {
    logs: Array<{
      id: string;             // UUID
      eventType: string;      // 이벤트 유형
      ipAddress: string;      // IP 주소
      userAgent: string;      // User-Agent
      metadata?: object;      // 추가 정보
      createdAt: string;      // ISO 8601
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }
}
```

**Example**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "eventType": "LOGIN_SUCCESS",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "metadata": {
          "sessionId": "abc123..."
        },
        "createdAt": "2026-02-09T10:30:00Z"
      },
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "eventType": "PASSWORD_CHANGED",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "metadata": {
          "changedBy": "user"
        },
        "createdAt": "2026-02-08T15:20:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45,
      "itemsPerPage": 20
    }
  }
}
```

**Errors**:
- **401 Unauthorized**: 세션 없음 또는 만료

- **400 Bad Request**: 잘못된 쿼리 파라미터
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "limit는 1에서 100 사이여야 합니다"
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
| UNAUTHORIZED | 401 | 인증 필요 |
| INVALID_PASSWORD | 403 | 잘못된 비밀번호 |
| NO_DELETION_REQUEST | 404 | 삭제 요청 없음 |
| EMAIL_ALREADY_EXISTS | 409 | 이메일 중복 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /change-password | 5회 | 1시간 |
| POST /deactivate | 3회 | 1시간 |
| POST /request-deletion | 3회 | 1시간 |
| GET /activity-log | 30회 | 1분 |
| 기타 엔드포인트 | 60회 | 1분 |

---

## Notes

- 모든 엔드포인트는 **인증 필수** (session 쿠키)
- 이메일 변경 시 **새 이메일로 인증** 필요 (인증 완료 후 변경 반영)
- 비밀번호 변경 후 **기존 세션 유지** (사용자 편의)
- 계정 비활성화/삭제 시 **즉시 로그아웃**
- 활동 로그는 **최근 1년간 데이터만** 조회 가능
- 페이지네이션은 **Cursor-based** 대신 **Offset-based** 사용 (간단한 구현)

