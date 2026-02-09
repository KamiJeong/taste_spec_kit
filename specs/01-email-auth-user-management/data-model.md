# Data Model: 이메일 기반 회원가입 및 회원관리

**Feature**: 001-email-auth-user-management  
**Date**: 2026-02-09  
**Phase**: 1 - Design

## Overview

이 문서는 이메일 기반 인증 시스템의 데이터 모델을 정의합니다. Drizzle ORM을 사용하여 TypeScript로 스키마를 정의하며, PostgreSQL 16.x에 배포됩니다.

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│       User          │
│─────────────────────│
│ id (UUID, PK)       │
│ email (String)      │◄─────┐
│ password_hash       │      │
│ name (String?)      │      │
│ email_verified      │      │
│ is_active           │      │
│ created_at          │      │
│ updated_at          │      │
│ deleted_at?         │      │
└─────────────────────┘      │
                             │ (FK)
         ┌───────────────────┼────────────────────┐
         │                   │                    │
┌────────▼──────────┐ ┌──────▼──────────┐ ┌──────▼──────────┐
│ EmailVerification │ │PasswordReset    │ │    AuthLog      │
│      Token        │ │     Token       │ │                 │
│───────────────────│ │─────────────────│ │─────────────────│
│ id (UUID, PK)     │ │ id (UUID, PK)   │ │ id (UUID, PK)   │
│ user_id (FK)      │ │ user_id (FK)    │ │ user_id? (FK)   │
│ token (String)    │ │ token (String)  │ │ event_type      │
│ expires_at        │ │ expires_at      │ │ ip_address      │
│ used_at?          │ │ used_at?        │ │ user_agent      │
│ created_at        │ │ created_at      │ │ metadata (JSON) │
└───────────────────┘ └─────────────────┘ │ created_at      │
                                          └─────────────────┘

Note: Session은 better-auth가 관리 (Redis + 자체 스키마)
```

---

## Entities

### 1. User (사용자)

사용자 계정 정보를 저장하는 핵심 엔티티입니다.

**Table Name**: `users`

**Drizzle Schema**:
```typescript
import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),
  emailVerified: boolean('email_verified').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete
});
```

**Fields**:
- `id`: UUID 고유 식별자 (자동 생성)
- `email`: 이메일 주소 (로그인 ID, unique constraint)
- `passwordHash`: Argon2id로 해시된 비밀번호 (평문 저장 금지)
- `name`: 사용자 이름 (선택 사항)
- `emailVerified`: 이메일 인증 완료 여부 (기본값: false)
- `isActive`: 계정 활성화 여부 (기본값: true, 비활성화 시 false)
- `createdAt`: 계정 생성일시
- `updatedAt`: 최종 수정일시 (자동 업데이트)
- `deletedAt`: 삭제 요청일시 (soft delete, null이면 활성)

**Indexes**:
- `email`: Unique index (중복 방지 + 빠른 조회)
- `created_at`: Index (최근 가입자 조회)

**Validation Rules**:
- `email`: RFC 5322 형식 준수 (Zod 검증)
- `passwordHash`: 반드시 Argon2id 해시 (서버 측에서만 설정)
- `name`: 1-100자 (선택 사항)
- `email_verified`: 로그인 전 반드시 true여야 함

**State Transitions**:
```
[가입] → email_verified: false, is_active: true
[이메일 인증] → email_verified: true
[계정 비활성화] → is_active: false
[삭제 요청] → deleted_at: <timestamp>
[30일 후] → 물리적 삭제 (별도 크론 작업)
```

---

### 2. EmailVerificationToken (이메일 인증 토큰)

이메일 주소 인증을 위한 일회용 토큰입니다.

**Table Name**: `email_verification_tokens`

**Drizzle Schema**:
```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Fields**:
- `id`: UUID 고유 식별자
- `userId`: 사용자 참조 (Foreign Key, cascade delete)
- `token`: 암호학적으로 안전한 랜덤 토큰 (32 bytes, base64url)
- `expiresAt`: 만료 시각 (생성 시각 + 24시간)
- `usedAt`: 토큰 사용 시각 (재사용 방지, null이면 미사용)
- `createdAt`: 토큰 생성일시

**Indexes**:
- `token`: Unique index (빠른 조회 + 중복 방지)
- `user_id`: Index (사용자별 토큰 조회)
- `expires_at`: Index (만료 토큰 정리)

**Business Rules**:
- 토큰은 사용 후 `usedAt` 필드를 설정하여 재사용 방지
- 만료된 토큰은 주기적으로 삭제 (크론 작업)
- 한 사용자가 여러 토큰을 가질 수 있음 (재발송 시)
- 가장 최근 토큰만 유효하게 처리 (이전 토큰은 무효화)

---

### 3. PasswordResetToken (비밀번호 재설정 토큰)

비밀번호 재설정을 위한 일회용 토큰입니다.

**Table Name**: `password_reset_tokens`

**Drizzle Schema**:
```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Fields**:
- `id`: UUID 고유 식별자
- `userId`: 사용자 참조 (Foreign Key, cascade delete)
- `token`: 암호학적으로 안전한 랜덤 토큰 (32 bytes, base64url)
- `expiresAt`: 만료 시각 (생성 시각 + 1시간)
- `usedAt`: 토큰 사용 시각 (재사용 방지)
- `createdAt`: 토큰 생성일시

**Indexes**:
- `token`: Unique index
- `user_id`: Index
- `expires_at`: Index

**Business Rules**:
- 이메일 인증 토큰보다 짧은 만료 시간 (1시간)
- 사용 후 즉시 무효화
- 한 사용자가 여러 요청 시 가장 최근 토큰만 유효

---

### 4. Session (세션)

**Note**: 이 엔티티는 better-auth 라이브러리가 관리하므로 직접 정의하지 않습니다. better-auth가 Redis에 세션 데이터를 저장하며, 자체 스키마를 사용합니다.

**better-auth Session Structure** (참고용):
```typescript
{
  sessionToken: string;       // 세션 토큰 (httpOnly 쿠키)
  userId: string;             // 사용자 ID
  expiresAt: Date;            // 만료 시각 (7일)
  createdAt: Date;            // 생성 시각
  updatedAt: Date;            // 최종 갱신 시각
  ipAddress?: string;         // IP 주소 (감사용)
  userAgent?: string;         // User-Agent (감사용)
}
```

**Storage**: Redis (key: `session:{sessionToken}`, TTL: 7 days)

---

### 5. AuthLog (인증 이벤트 로그)

인증 관련 이벤트를 감사 로그로 기록합니다.

**Table Name**: `auth_logs`

**Drizzle Schema**:
```typescript
import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export enum AuthEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  SIGNUP = 'SIGNUP',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
}

export const authLogs = pgTable('auth_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(), // IPv6 지원
  userAgent: varchar('user_agent', { length: 500 }),
  metadata: jsonb('metadata'), // 추가 정보 (실패 이유, 세션 ID 등)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Fields**:
- `id`: UUID 고유 식별자
- `userId`: 사용자 참조 (nullable, 로그인 실패 시 null 가능)
- `eventType`: 이벤트 유형 (Enum)
- `ipAddress`: 요청 IP 주소 (IPv4/IPv6)
- `userAgent`: 브라우저 User-Agent
- `metadata`: JSONB 추가 정보 (실패 이유, 세션 ID, 변경 전/후 값 등)
- `createdAt`: 이벤트 발생일시

**Indexes**:
- `user_id`: Index (사용자별 이벤트 조회)
- `event_type`: Index (이벤트 유형별 조회)
- `created_at`: Index (시간 범위 조회, 최근 로그 우선)
- Composite: `(user_id, created_at DESC)` (사용자별 최근 이벤트)

**Event Types**:
- `LOGIN_SUCCESS`: 로그인 성공
- `LOGIN_FAILED`: 로그인 실패 (잘못된 비밀번호, 이메일 미인증 등)
- `LOGOUT`: 로그아웃
- `SIGNUP`: 회원가입
- `EMAIL_VERIFIED`: 이메일 인증 완료
- `PASSWORD_CHANGED`: 비밀번호 변경
- `PASSWORD_RESET_REQUESTED`: 비밀번호 재설정 요청
- `PASSWORD_RESET_COMPLETED`: 비밀번호 재설정 완료
- `ACCOUNT_DEACTIVATED`: 계정 비활성화
- `ACCOUNT_DELETED`: 계정 삭제 요청

**Metadata Examples**:
```typescript
// LOGIN_FAILED
{
  reason: 'INVALID_PASSWORD' | 'EMAIL_NOT_VERIFIED' | 'ACCOUNT_INACTIVE',
  attemptedEmail: 'user@example.com',
}

// PASSWORD_CHANGED
{
  sessionId: '<session-token>',
  changedBy: 'user' | 'admin',
}
```

---

## Relationships

### User → EmailVerificationToken
- **Type**: One-to-Many
- **Cascade**: Delete (사용자 삭제 시 토큰도 삭제)
- **Business Rule**: 사용자는 여러 인증 토큰을 가질 수 있음 (재발송)

### User → PasswordResetToken
- **Type**: One-to-Many
- **Cascade**: Delete
- **Business Rule**: 사용자는 여러 재설정 토큰을 가질 수 있음

### User → AuthLog
- **Type**: One-to-Many
- **Cascade**: Set Null (사용자 삭제 시 로그는 유지, userId만 null)
- **Business Rule**: 감사 로그는 영구 보존 (사용자 삭제 후에도)

### User ← Session (better-auth 관리)
- **Type**: One-to-Many
- **Storage**: Redis (PostgreSQL 아님)
- **TTL**: 7 days (자동 만료)

---

## Database Migrations

### Initial Migration

```sql
-- Migration: 001_create_users_table.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Migration: 002_create_tokens_tables.sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_tokens_expires_at ON email_verification_tokens(expires_at);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_tokens_expires_at ON password_reset_tokens(expires_at);

-- Migration: 003_create_auth_logs_table.sql
CREATE TABLE auth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_event_type ON auth_logs(event_type);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX idx_auth_logs_user_created ON auth_logs(user_id, created_at DESC);
```

**Migration Strategy**:
1. Drizzle Kit으로 TypeScript 스키마에서 마이그레이션 자동 생성
2. 생성된 SQL 파일을 Git으로 버전 관리
3. CI/CD 파이프라인에서 자동 실행
4. Rollback 스크립트 자동 생성

---

## Data Validation

### Application Level (Zod)

```typescript
import { z } from 'zod';

// User 생성 시 검증
export const createUserSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[a-z]/, '소문자를 포함해야 합니다')
    .regex(/[A-Z]/, '대문자를 포함해야 합니다')
    .regex(/[0-9]/, '숫자를 포함해야 합니다')
    .regex(/[^a-zA-Z0-9]/, '특수문자를 포함해야 합니다'),
  name: z.string().min(1).max(100).optional(),
});

// User 업데이트 시 검증
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});
```

### Database Level

- **Unique Constraints**: `users.email`, `*_tokens.token`
- **Foreign Key Constraints**: Cascade delete/set null
- **NOT NULL Constraints**: 필수 필드
- **Check Constraints**: 추가 검증 (예: email_verified는 boolean)

---

## Performance Optimization

### Indexing Strategy
- **Primary Keys**: 모든 테이블에 UUID 인덱스 (자동)
- **Foreign Keys**: 조인 최적화를 위한 인덱스
- **Lookup Fields**: email, token (빠른 조회)
- **Time-based Queries**: created_at, expires_at (시간 범위 조회)

### Query Patterns
- **N+1 Problem 방지**: Drizzle의 `.with()` 사용하여 eager loading
- **Pagination**: Offset/Limit 대신 Cursor-based pagination (더 나은 성능)
- **Soft Delete**: `deleted_at IS NULL` 조건을 인덱스에 포함 (Partial Index)

```sql
-- Soft Delete를 위한 Partial Index
CREATE INDEX idx_users_active ON users(email) WHERE deleted_at IS NULL;
```

### Connection Pooling
```typescript
// Drizzle 연결 풀 설정
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 타임아웃
  connectionTimeoutMillis: 2000, // 연결 타임아웃
});

export const db = drizzle(pool);
```

---

## Security Considerations

### Password Security
- **Hashing**: Argon2id (memory-hard)
- **No Plain Text**: 비밀번호는 절대 평문 저장 금지
- **Validation**: 클라이언트 + 서버 양측 검증

### Token Security
- **Entropy**: 32 bytes (256 bits) 암호학적 난수
- **One-time Use**: 사용 후 `usedAt` 설정으로 재사용 방지
- **Expiration**: 짧은 만료 시간 (이메일: 24시간, 비밀번호: 1시간)
- **HTTPS Only**: 토큰은 HTTPS로만 전송

### SQL Injection Prevention
- **Parameterized Queries**: Drizzle ORM 사용으로 자동 방지
- **No Raw SQL**: 가능한 한 ORM 메서드 사용

### Audit Trail
- **AuthLog**: 모든 인증 이벤트 기록
- **Immutable**: 로그는 수정/삭제 불가 (감사 목적)
- **Privacy**: 민감 정보(비밀번호)는 로그에 기록 금지

---

## Data Retention Policy

### User Data
- **Active Users**: 무기한 보존
- **Deactivated Users**: 재활성화 요청 시 복구 가능
- **Deleted Users**: 30일 유예 후 영구 삭제 (크론 작업)

### Tokens
- **Expired Tokens**: 만료 후 7일간 보존 후 삭제 (디버깅 목적)
- **Used Tokens**: 사용 후 즉시 무효화, 7일 후 삭제

### Logs
- **AuthLog**: 최소 1년 보존 (법적 요구사항 확인 필요)
- **Session**: Redis TTL로 자동 만료 (7일)

**Cleanup Cron Jobs**:
```typescript
// 매일 오전 3시 실행
// 1. 만료된 토큰 삭제
// 2. 30일 경과한 soft delete 사용자 영구 삭제
// 3. 1년 경과한 로그 아카이빙 (선택적)
```

---

## Summary

- **4개 주요 엔티티**: User, EmailVerificationToken, PasswordResetToken, AuthLog
- **1개 외부 관리 엔티티**: Session (better-auth + Redis)
- **타입 안전**: Drizzle ORM으로 TypeScript 타입 자동 생성
- **보안**: 비밀번호 해시, 토큰 일회용, 감사 로그
- **성능**: 적절한 인덱싱, 연결 풀, Redis 캐싱
- **Constitution 준수**: SSOT (User 테이블), Type-Safety (Drizzle), Boundaries (명확한 관계)

**Next Steps**: Phase 1 계속 - API Contracts 정의 (`contracts/` 디렉토리)

