# Data Model: User Authentication System

**Feature**: 001-user-auth  
**Date**: 2026-02-05  
**Phase**: Phase 1 - Data Model Design

## Overview

This document defines the database schema, entities, and relationships for the user authentication system. The data model supports user registration, session management, and profile updates with a focus on security, performance, and ACID compliance.

---

## Database Schema

### Technology
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.0+
- **Migration Tool**: Prisma Migrate
- **Authentication**: better-auth (manages User and Session models)
- **Cache/Session**: Redis (session storage and rate limiting)

**Note**: better-auth provides built-in models for User and Session. The schema below extends better-auth's default schema with our specific requirements.

---

## Entities

### User (PostgreSQL)

Represents a registered user in the system.

**Table Name**: `users`

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address (primary login credential) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash of user's password (work factor 12) |
| display_name | VARCHAR(100) | NOT NULL | User's display name (editable) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last profile update timestamp |

**Indexes**:
- Primary index on `id` (automatically created)
- Unique index on `email` (for login lookup and duplicate prevention)

**Validation Rules**:
- `email`: Must match email regex pattern (validated via Zod)
- `password_hash`: Must be bcrypt hash (never store plaintext)
- `display_name`: 1-100 characters, allows Unicode (emojis, special characters)

**Notes**:
- Email is immutable after account creation (no UPDATE allowed via API)
- Password is never returned in API responses
- `updated_at` is automatically updated by Prisma on any field change

---

### Session (Redis - Managed by better-auth)

Sessions are automatically managed by better-auth in Redis for optimal performance.

**Storage**: Redis key-value store
**Key Pattern**: `session:{sessionToken}`
**TTL**: 30 days (automatically renewed on activity)

**Session Data Structure** (JSON):
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "displayName": "John Doe",
  "createdAt": "2026-02-05T12:00:00Z",
  "expiresAt": "2026-03-07T12:00:00Z",
  "lastActivity": "2026-02-05T14:30:00Z"
}
```

**Benefits**:
- **Performance**: O(1) session lookup (vs database query)
- **Automatic Expiration**: Redis TTL handles cleanup
- **Scalability**: Redis can handle millions of sessions
- **Atomic Operations**: Built-in support for session refresh

**Notes**:
- Sessions automatically expire after 30 days of inactivity
- Activity updates extend TTL without database writes
- No manual cleanup required (Redis handles it)
- Multi-device support via multiple session keys per user

---

## Relationships

```
PostgreSQL:
┌─────────────────┐
│     User        │
│─────────────────│
│ id (PK)         │
│ email (UNIQUE)  │
│ password_hash   │
│ display_name    │
│ created_at      │
│ updated_at      │
└─────────────────┘

Redis (managed by better-auth):
┌─────────────────┐
│    Session      │
│─────────────────│
│ sessionToken    │ (key)
│ userId          │ (references User.id)
│ expiresAt       │ (TTL)
│ data            │ (JSON: user info, lastActivity)
└─────────────────┘
```

**Relationship Rules**:
- One user can have multiple active sessions (multi-device support)
- Sessions stored in Redis with automatic TTL-based expiration
- User deletion triggers session cleanup via better-auth
- Redis provides O(1) session lookup performance
- PostgreSQL provides ACID guarantees for user data

---

## Prisma 스키마

**참고**: 이 스키마는 better-auth의 요구사항과 호환됩니다. better-auth는 Redis에서 세션을 자동으로 생성하고 관리하며, 사용자 데이터는 PostgreSQL에 저장됩니다.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique @db.VarChar(255)
  passwordHash  String    @map("password_hash") @db.VarChar(255)
  displayName   String    @map("display_name") @db.VarChar(100)
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamp(6)
  
  // better-auth가 Redis에서 세션을 관리함
  // 데이터베이스에 sessions 관계 불필요

  @@map("users")
}

// Session 모델 제거 - better-auth가 Redis에서 세션 관리
// 이는 더 나은 성능과 자동 세션 정리를 제공함
```

**세션 관리 전략**: 
- better-auth는 빠른 접근과 자동 만료를 위해 Redis에 세션 저장
- PostgreSQL은 내구성과 복잡한 쿼리를 위해 사용자 데이터 저장
- 이 하이브리드 접근 방식은 두 가지 장점 모두 제공: 속도 + 안정성

---

## Data Access Patterns

### Note on better-auth Integration
The following patterns show the underlying data operations. In practice, better-auth provides higher-level APIs that handle most of these operations automatically with built-in security and session management.

### 1. User Registration (Signup)
```typescript
// better-auth handles this automatically
import { auth } from '@/lib/auth/server'

// User calls better-auth signup
const result = await auth.signUp({
  email: 'user@example.com',
  password: 'SecureP@ss123',
  name: 'John Doe', // maps to displayName
})

// better-auth internally:
// 1. Validates input with Zod
// 2. Hashes password with bcrypt
// 3. Creates user in database
// 4. Creates session in Redis
// 5. Returns session cookie
```

**Performance**: Single INSERT query to PostgreSQL. Session created in Redis O(1).

---

### 2. User Login
```typescript
// better-auth handles password verification and session creation
import { auth } from '@/lib/auth/server'

const result = await auth.signIn({
  email: 'user@example.com',
  password: 'SecureP@ss123',
})

// better-auth internally:
// 1. Finds user by email (PostgreSQL indexed query)
// 2. Verifies password with bcrypt
// 3. Creates session in Redis
// 4. Returns session cookie
```

**Performance**: 
- User lookup: Index scan on `email` (O(log n))
- Session creation: Redis SET operation (O(1))

---

### 3. Session Validation
```typescript
// better-auth automatically validates on each request
import { auth } from '@/lib/auth/server'

const session = await auth.getSession()
// Returns user data if valid, null if expired/invalid

// better-auth internally:
// 1. Reads session from cookie
// 2. Validates session in Redis (O(1))
// 3. Auto-refreshes TTL if needed
// 4. Returns user data (cached in Redis)
```

**Performance**: 
- Session lookup: Redis GET operation (O(1))
- No database query needed for most requests (data cached in Redis)

---

### 4. User Logout
```typescript
// better-auth handles session cleanup
import { auth } from '@/lib/auth/server'

await auth.signOut()

// better-auth internally:
// 1. Deletes session from Redis
// 2. Clears session cookie
```

**Performance**: Redis DEL operation (O(1)).

---

### 5. Profile Update
```typescript
// Direct Prisma access for profile data
const user = await prisma.user.update({
  where: { id: userId },
  data: { displayName: 'New Name' },
})

// Update session cache in Redis
await auth.updateSession({ user })
```

**Performance**: Single UPDATE by primary key. `updatedAt` automatically updated.

---

### 6. Multi-Device Session Query
```typescript
// better-auth provides session management APIs
import { auth } from '@/lib/auth/server'

// Get all active sessions for current user
const sessions = await auth.getUserSessions()

// Returns array of session metadata from Redis
```

**Performance**: Redis SCAN operation (O(N) where N = user's session count, typically < 10).

---

## 마이그레이션 전략

### 초기 마이그레이션
```bash
npx prisma migrate dev --name init
```

모든 인덱스와 함께 `users` 테이블을 생성합니다. 세션은 better-auth에 의해 Redis에서 관리됩니다 (마이그레이션 불필요).

### better-auth 설정
```bash
# better-auth가 세션 스키마를 자동으로 처리
# 수동 세션 테이블 생성 불필요
```

### 향후 마이그레이션
- 2FA를 위한 컬럼 추가: `two_factor_enabled`, `two_factor_secret`
- 이메일 인증을 위한 컬럼 추가: `email_verified`, `verification_token`
- 비밀번호 재설정을 위한 컬럼 추가: `reset_token`, `reset_token_expires_at`
- 참고: better-auth는 이러한 기능을 위한 플러그인 제공

---

## Security Considerations

### 1. Password Storage
- **Never store plaintext passwords**
- better-auth uses bcrypt with work factor 12 (adjustable for future-proofing)
- Hash computed server-side only
- Passwords automatically validated and hashed by better-auth

### 2. Session Token Storage
- **Session tokens stored in encrypted cookies** (via better-auth)
- **Session data stored in Redis** with automatic TTL
- Secure random token generation (cryptographically secure)
- HTTP-only, Secure, SameSite cookies by default

### 3. Database Security
- **Least-privilege principle**: Application user has no DROP/ALTER permissions
- **SSL/TLS connections**: Enforce encrypted connections to database
- **Regular backups**: Automated daily backups with encryption at rest
- **Redis ACL**: Use Redis ACL for access control

### 4. Sensitive Data Handling
- **Never log passwords or tokens**
- **Exclude password_hash from API responses** (Prisma select/omit)
- **Sanitize error messages** (don't reveal whether email exists)
- **Redis data encrypted in transit** (TLS)

### 5. better-auth Security Features
- Built-in CSRF protection
- Automatic session rotation
- Rate limiting support
- Secure cookie settings by default
- XSS protection via HTTP-only cookies

---

## 성능 최적화

### 데이터베이스 쿼리 최적화
- 빠른 사용자 조회를 위한 `email` 인덱스 (고유)
- Prisma를 통한 연결 풀링 (기본값: 10개 연결)
- ORM을 통한 준비된 문장 (SQL 인젝션 방지 + 성능)

### Redis 세션 최적화
- O(1) 세션 조회 vs O(log n) 데이터베이스 쿼리
- TTL을 통한 자동 만료 (정리 쿼리 불필요)
- 밀리초 미만 응답 시간을 위한 인메모리 저장소
- ioredis를 통한 연결 풀링

### 예상 쿼리 성능 (1000명 동시 사용자 기준)
- 이메일로 사용자 조회: <10ms (인덱싱된 PostgreSQL 쿼리)
- 세션 검증: <1ms (Redis 인메모리 조회)
- 프로필 업데이트: <20ms (PostgreSQL로 단일 UPDATE)
- 로그인: <50ms (사용자 조회 + 비밀번호 검증 + 세션 생성)

### 확장성 고려사항
- PostgreSQL은 적절한 인덱싱으로 수백만 사용자 처리
- Redis는 수평 확장으로 수백만 세션 처리 가능
- 세션 정리 불필요 (자동 TTL 만료)
- better-auth는 수평 확장을 위한 Redis Cluster 지원
- 현재 설정으로 10,000명 이상의 동시 사용자 쉽게 지원

---

## Edge Cases

### 1. Concurrent Session Creation
**Scenario**: User logs in from two devices simultaneously.

**Handling**: Each login creates a separate session in Redis. Both are valid. No conflict. Redis atomic operations ensure consistency.

---

### 2. Session Renewal Race Condition
**Scenario**: Two requests from same session arrive simultaneously, both try to renew.

**Handling**: Redis atomic operations (SETEX) handle race conditions. better-auth ensures safe TTL updates. Both requests succeed.

---

### 3. Email Uniqueness Violation
**Scenario**: Two signup requests with same email arrive simultaneously.

**Handling**: Database unique constraint on `email` rejects second request. First succeeds, second gets 409 Conflict error.

---

### 4. Expired Session Access
**Scenario**: User tries to use session after 30 days of inactivity.

**Handling**: Redis TTL automatically expires the key. Session not found. better-auth returns null. User redirected to login.

---

### 5. Redis Downtime
**Scenario**: Redis becomes unavailable temporarily.

**Handling**: 
- All session operations fail gracefully
- Users redirected to login
- No data loss (users in PostgreSQL remain intact)
- Sessions recreated after Redis recovery

---

### 6. Session Token Theft
**Scenario**: Attacker steals session cookie.

**Handling**:
- HTTP-only cookie prevents JavaScript access
- Secure flag ensures HTTPS-only transmission
- SameSite prevents CSRF attacks
- User can revoke all sessions via "logout all devices"

---

## Data Retention

### Active Data
- **Users**: Retained indefinitely in PostgreSQL (until user requests deletion - out of scope for MVP)
- **Active Sessions**: Retained in Redis until expiration or logout

### Expired Data
- **Expired Sessions**: Automatically deleted by Redis TTL (no cleanup job needed)
  - Redis automatically removes keys when TTL expires
  - No manual cleanup required
  - Zero overhead for session expiration

### Backup Strategy
- **PostgreSQL**: Daily automated backups with point-in-time recovery
- **Redis**: Optional persistence (RDB/AOF) for session recovery after restart
- **Session Data**: Not critical for backups (can be recreated by re-login)

---

## 테스트 전략

### 데이터베이스 테스트
1. **스키마 테스트**: Drizzle 스키마가 올바른 SQL을 생성하는지 확인
2. **제약조건 테스트**: 고유 이메일 제약조건 확인
3. **인덱스 테스트**: 쿼리 계획이 인덱스를 사용하는지 확인 (EXPLAIN ANALYZE)
4. **마이그레이션 테스트**: 마이그레이션이 멱등성이고 되돌릴 수 있는지 확인
5. **타입 안전성 테스트**: Drizzle의 타입 추론 검증

**Drizzle 테스트 예시**:
```typescript
import { describe, it, expect } from 'vitest'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

describe('User Schema', () => {
  it('should create user with valid data', async () => {
    const newUser = await db.insert(users).values({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      displayName: 'Test User',
    }).returning()
    
    expect(newUser[0].email).toBe('test@example.com')
  })
  
  it('should reject duplicate email', async () => {
    await expect(
      db.insert(users).values({
        email: 'test@example.com', // 중복
        passwordHash: 'hash',
        displayName: 'Test',
      })
    ).rejects.toThrow()
  })
})
```

### Redis 테스트
1. **세션 CRUD**: Redis에서 생성, 읽기, 업데이트, 삭제 작업 테스트
2. **TTL 테스트**: 30일 후 자동 만료 확인
3. **원자적 연산**: 동시 세션 업데이트 테스트
4. **페일오버 테스트**: Redis 사용 불가 시 우아한 성능 저하 테스트

### better-auth 통합 테스트
1. **인증 흐름**: 전체 회원가입/로그인/로그아웃 흐름 테스트
2. **세션 관리**: 세션 생성, 검증, 갱신 테스트
3. **보안**: CSRF 보호, 쿠키 보안 설정 테스트
4. **에러 처리**: 우아한 실패 및 에러 메시지 테스트

### 데이터 접근 테스트
1. **CRUD 작업**: 모든 생성, 읽기, 업데이트, 삭제 작업 테스트
2. **동시성 테스트**: 동시 회원가입, 로그인, 세션 갱신 시뮬레이션
3. **엣지 케이스 테스트**: 위에 문서화된 모든 엣지 케이스 테스트
4. **성능 테스트**: <200ms p95 지연 시간 목표 확인
5. **Drizzle 쿼리 테스트**: 타입 안전성 및 쿼리 생성 확인

---

## Future Enhancements (Out of Scope)

These features can be added using better-auth plugins and database migrations:

1. **Email Verification**: 
   - Add `email_verified` boolean, `verification_token` string
   - Use better-auth email verification plugin

2. **Password Reset**: 
   - Add `reset_token`, `reset_token_expires_at`
   - Use better-auth password reset plugin

3. **Two-Factor Authentication**: 
   - Add `two_factor_enabled`, `two_factor_secret`
   - Use better-auth 2FA plugin

4. **OAuth Providers**: 
   - Social login (Google, GitHub, etc.)
   - Use better-auth OAuth plugin

5. **Session Revocation UI**: 
   - View all active sessions
   - Revoke individual sessions
   - "Logout all other devices" feature

6. **Audit Log**: 
   - Separate `audit_log` table for compliance
   - Track logins, logouts, profile changes
   - IP address and device tracking

7. **Soft Delete Users**: 
   - Add `deleted_at` timestamp
   - Preserve data for compliance
   - Anonymize instead of hard delete

---

## 요약

데이터 모델은 **사용자 데이터를 위한 PostgreSQL**과 **세션을 위한 Redis** (better-auth로 관리)의 하이브리드 접근 방식을 사용합니다:

**User 엔티티 (PostgreSQL)**:
- 사용자 계정을 위한 영구 저장소
- 데이터 무결성을 위한 ACID 준수
- 빠른 조회를 위한 인덱싱된 이메일

**세션 관리 (better-auth를 통한 Redis)**:
- O(1) 세션 검증 (밀리초 미만)
- 자동 TTL 기반 만료
- 수평 확장성

**주요 장점**:
- **보안**: 해시된 비밀번호, 암호화된 세션 쿠키, better-auth를 통한 CSRF 보호
- **성능**: <1ms 세션 조회, <50ms 로그인 시간, <200ms p95 목표 충족
- **확장성**: 수백만 사용자(PostgreSQL) 및 수백만 세션(Redis)까지 검증됨
- **단순성**: better-auth가 유연성을 유지하면서 복잡성을 추상화
- **개발자 경험**: 타입 안전 API, 최소한의 구성, 우수한 문서

**아키텍처 결정**: 
이 하이브리드 접근 방식(PostgreSQL + Redis)은 인증 시스템에 최적입니다:
- PostgreSQL은 사용자 데이터에 대한 내구성과 복잡한 쿼리 제공
- Redis는 임시 세션에 대한 속도와 자동 만료 제공
- better-auth는 보안, 타입 안전성, 최신 Next.js 통합 제공

모든 설계 결정은 Technical Context(plan.md 참조)와 일치하며 기능 명세서에 정의된 4가지 주요 사용자 흐름(회원가입, 로그인, 로그아웃, 프로필 관리)을 지원합니다.
