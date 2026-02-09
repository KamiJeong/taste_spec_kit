# Research: 이메일 기반 회원가입 및 회원관리

**Feature**: 001-email-auth-user-management  
**Date**: 2026-02-09  
**Phase**: 0 - Research & Decisions

## Overview

이 문서는 이메일 기반 인증 시스템 구현을 위한 기술 조사 및 결정 사항을 기록합니다. 모든 "NEEDS CLARIFICATION" 항목을 해결하고, 기술 선택의 근거를 명시합니다.

---

## Research Topics

### 1. 비밀번호 해싱 알고리즘 선택

**Decision**: **Argon2id** 사용

**Rationale**:
- **보안성**: Argon2는 2015 Password Hashing Competition 우승 알고리즘으로, bcrypt보다 현대적이며 GPU/ASIC 공격에 강함
- **better-auth 지원**: better-auth 라이브러리가 기본적으로 argon2를 지원하며 설정이 간단함
- **메모리 하드**: 메모리 집약적 설계로 무차별 대입 공격 비용을 크게 증가시킴
- **성능**: 파라미터 조정으로 보안과 성능의 균형을 맞출 수 있음 (메모리: 64MB, 반복: 3회, 병렬: 4)

**Alternatives Considered**:
- **bcrypt**: 널리 사용되지만 메모리 하드가 아니며, GPU 공격에 취약. Argon2가 더 현대적이고 안전함
- **scrypt**: 메모리 하드이지만 Argon2보다 검증이 적고, better-auth에서 기본 지원하지 않음
- **PBKDF2**: NIST 표준이지만 GPU 공격에 취약하며, 현대 기준으로는 권장되지 않음

**Implementation**:
```typescript
// better-auth 설정에서 argon2 사용
import { betterAuth } from "better-auth";
import { argon2 } from "better-auth/crypto";

export const auth = betterAuth({
  crypto: {
    hashPassword: argon2.hash,
    verifyPassword: argon2.verify,
  },
  // 기본 파라미터: memory=64MB, iterations=3, parallelism=4
});
```

---

### 2. 세션 vs JWT 토큰 전략

**Decision**: **서버 세션 (Redis 기반)** 사용

**Rationale**:
- **보안**: 세션 무효화가 즉시 가능 (로그아웃, 계정 비활성화 시 즉시 반영). JWT는 토큰 만료 전까지 유효함
- **확장성**: Redis 클러스터로 수평 확장 가능하며, 세션 데이터를 중앙 집중식으로 관리
- **프로젝트 스택**: Redis 7.x가 이미 기술 스택에 포함되어 추가 의존성 없음
- **better-auth 지원**: better-auth가 세션 기반 인증을 기본으로 지원하며 Redis 어댑터 제공
- **감사 추적**: 세션 데이터에 메타데이터(IP, User-Agent) 저장으로 보안 감사 용이

**Alternatives Considered**:
- **JWT (Stateless)**: 무상태 특성이 있지만, 토큰 무효화가 어렵고, 보안 이벤트 발생 시 즉시 대응 불가. 블랙리스트 관리로 상태를 도입하면 세션과 차이 없음
- **JWT + Refresh Token**: 복잡도가 높아지고, 여전히 무효화 문제 존재. 초기 구현에는 과도한 복잡성
- **Database Session**: Redis보다 느리고, DB 부하 증가. Redis 캐시가 성능과 비용 면에서 우수

**Implementation**:
```typescript
// better-auth Redis 세션 설정
import { betterAuth } from "better-auth";
import { redisAdapter } from "better-auth/adapters/redis";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

export const auth = betterAuth({
  session: {
    adapter: redisAdapter(redis),
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session age every 24 hours
  },
});
```

---

### 3. 이메일 발송 서비스 선택

**Decision**: **환경 변수로 전환 가능한 추상화 레이어 + 개발 시 Mailhog**

**Rationale**:
- **Local-First**: 로컬 개발 시 Mailhog (Docker)으로 이메일 캡처하여 실제 발송 없이 테스트 가능
- **Cost-Aware**: 프로덕션에서는 SendGrid, AWS SES, Resend 등 무료 티어가 있는 서비스 선택 가능
- **유연성**: 이메일 서비스 변경 시 설정만 바꾸면 되도록 추상화
- **Overrides-Only**: 기본 SMTP 프로토콜을 사용하되, 서비스별 특화 기능은 환경 변수로 오버라이드

**Alternatives Considered**:
- **SendGrid 고정**: 무료 티어 100 emails/day이지만, 서비스 종속성 증가 및 로컬 개발 불편
- **AWS SES**: 비용 효율적(월 62,000 emails 무료)이지만 AWS 계정 필요, 초기 설정 복잡
- **Resend**: 개발자 친화적이지만 무료 티어가 SendGrid보다 적음 (월 100 emails)
- **Nodemailer 직접 구현**: 재시도 로직, 큐 관리를 직접 구현해야 하며, 복잡도 증가

**Implementation**:
```typescript
// Email Module with abstraction
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // 환경 변수로 전환
    const config = {
      host: process.env.SMTP_HOST || 'localhost', // Mailhog: localhost
      port: parseInt(process.env.SMTP_PORT || '1025'), // Mailhog: 1025
      secure: process.env.SMTP_SECURE === 'true', // false for Mailhog
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    };
    this.transporter = nodemailer.createTransporter(config);
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: email,
      subject: '이메일 인증을 완료해주세요',
      html: `<p>아래 링크를 클릭하여 이메일 인증을 완료하세요:</p>
             <a href="${verifyUrl}">${verifyUrl}</a>
             <p>이 링크는 24시간 후 만료됩니다.</p>`,
    });
  }
}
```

**Production Options** (환경 변수로 선택):
- **Mailhog (개발)**: `SMTP_HOST=localhost`, `SMTP_PORT=1025`
- **SendGrid**: `SMTP_HOST=smtp.sendgrid.net`, `SMTP_USER=apikey`, `SMTP_PASS=<API_KEY>`
- **AWS SES**: `SMTP_HOST=email-smtp.region.amazonaws.com`, AWS credentials
- **Resend**: Resend API 사용 (REST API, nodemailer 대신 직접 HTTP 호출)

---

### 4. Rate Limiting 구현 방법

**Decision**: **Redis + NestJS Throttler 모듈**

**Rationale**:
- **확장성**: Redis를 사용하여 여러 서버 인스턴스 간 rate limit 상태 공유 가능
- **NestJS 통합**: `@nestjs/throttler` 패키지가 Redis 저장소 지원하며, 설정이 간단
- **유연성**: 엔드포인트별로 다른 제한 설정 가능 (로그인: 5회/15분, 비밀번호 재설정: 3회/1시간)
- **성능**: Redis의 빠른 읽기/쓰기로 rate limit 체크 오버헤드 최소화

**Alternatives Considered**:
- **In-Memory Rate Limiter**: 단일 서버에서만 작동하며, 확장 시 문제. Redis가 이미 있으므로 활용
- **Database-Based**: DB 쿼리 오버헤드가 크고, rate limiting은 빠른 응답이 필요하므로 부적합
- **Express-rate-limit**: NestJS 생태계에서 벗어나며, Redis 통합이 Throttler보다 복잡

**Implementation**:
```typescript
// Rate Limiting 설정
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60, // 기본: 60초
          limit: 10, // 기본: 10회
        },
      ],
      storage: new ThrottlerStorageRedisService({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      }),
    }),
  ],
})
export class AppModule {}

// 로그인 엔드포인트에 특정 제한 적용
@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 900 } }) // 5회/15분
  async login(@Body() dto: LoginDto) {
    // ...
  }
}
```

---

### 5. 이메일 발송 재시도 로직 (큐 시스템)

**Decision**: **BullMQ (Redis 기반 큐)**

**Rationale**:
- **신뢰성**: 이메일 발송 실패 시 자동 재시도, 지수 백오프 지원
- **Redis 통합**: Redis를 이미 사용하므로 추가 인프라 불필요
- **NestJS 통합**: `@nestjs/bull` 패키지로 간단하게 통합 가능
- **모니터링**: Bull Board로 큐 상태, 실패 작업 모니터링 가능
- **Cost-Aware**: 이메일 발송 실패를 최소화하여 무료 티어 한도 내에서 안정적 운영

**Alternatives Considered**:
- **직접 재시도 구현**: 복잡도 증가, 장애 복구 어려움, 재발명의 오류
- **RabbitMQ**: 별도 인프라 필요, Redis로 충분한 규모에서는 과도한 복잡성
- **AWS SQS**: 클라우드 종속성, 비용 발생, Local-First 원칙 위반

**Implementation**:
```typescript
// Email Queue 설정
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
})
export class EmailModule {}

// Email Processor
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('email')
export class EmailProcessor {
  constructor(private emailService: EmailService) {}

  @Process('send-verification')
  async handleVerification(job: Job) {
    const { email, token } = job.data;
    await this.emailService.sendVerificationEmail(email, token);
  }
}

// Email 큐에 작업 추가 (재시도 3회, 지수 백오프)
await this.emailQueue.add('send-verification', 
  { email, token }, 
  { 
    attempts: 3, 
    backoff: { type: 'exponential', delay: 5000 } 
  }
);
```

---

### 6. 토큰 생성 및 보안

**Decision**: **crypto.randomBytes (Node.js 내장) + URL-safe Base64 인코딩**

**Rationale**:
- **보안**: `crypto.randomBytes`는 암호학적으로 안전한 난수 생성기 (CSPRNG)
- **추가 의존성 없음**: Node.js 표준 라이브러리 사용으로 외부 패키지 불필요
- **충분한 엔트로피**: 32바이트 (256비트)로 충분한 무작위성 보장
- **URL 안전**: Base64 URL-safe 인코딩으로 이메일 링크에 사용 가능

**Alternatives Considered**:
- **UUID v4**: 128비트로 엔트로피가 낮으며, 보안 토큰용으로는 권장되지 않음
- **JWT**: 토큰 자체에 데이터를 포함하는 구조로, 이메일 인증 링크에는 불필요한 복잡성
- **외부 라이브러리 (nanoid)**: 간결하지만 표준 라이브러리로 충분한 경우 추가 의존성 불필요

**Implementation**:
```typescript
import { randomBytes } from 'crypto';

export function generateSecureToken(): string {
  const token = randomBytes(32).toString('base64url'); // URL-safe Base64
  return token; // 예: "a3d5f2g8h9j1k2l3m4n5p6q7r8s9t0u1v2w3x4y5z6"
}
```

---

### 7. 데이터베이스 마이그레이션 전략

**Decision**: **Drizzle Kit 자동 마이그레이션 생성**

**Rationale**:
- **타입 안전**: TypeScript 스키마 정의에서 마이그레이션 자동 생성
- **버전 관리**: 마이그레이션 파일을 Git으로 관리하여 변경 이력 추적
- **Rollback 지원**: 마이그레이션 되돌리기 기능 제공
- **Pinned-Stack**: Drizzle ORM이 이미 기술 스택에 포함되어 추가 도구 불필요

**Alternatives Considered**:
- **TypeORM Migrations**: TypeORM이 아닌 Drizzle을 사용하므로 해당 없음
- **수동 SQL 작성**: 타입 안전성 부족, 실수 가능성 증가, 자동화 부족
- **Prisma Migrate**: Prisma를 사용하지 않으므로 해당 없음

**Implementation**:
```bash
# Drizzle Kit 설정 (drizzle.config.ts)
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema/*.ts',
  out: './src/database/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});

# 마이그레이션 생성
bun drizzle-kit generate:pg

# 마이그레이션 실행
bun drizzle-kit push:pg
```

---

## Best Practices

### better-auth 통합

- **공식 문서 준수**: [better-auth.com/docs](https://better-auth.com/docs) 참조
- **타입 안전 클라이언트**: better-auth의 TypeScript 클라이언트 사용으로 프론트엔드-백엔드 타입 일치 보장
- **플러그인 활용**: better-auth의 이메일 인증, 비밀번호 재설정 플러그인 사용

### NestJS 인증 모듈 패턴

- **Guards**: `@UseGuards(AuthGuard)` 데코레이터로 보호된 라우트 구현
- **Interceptors**: 요청/응답 로깅, 에러 핸들링
- **Exception Filters**: 일관된 에러 응답 형식 (Zod 검증 에러 포맷팅)

### Zod 검증 Best Practices

- **재사용 가능한 스키마**: 공통 검증 로직을 별도 스키마로 분리
- **커스텀 에러 메시지**: 사용자 친화적 에러 메시지 제공
- **타입 추출**: `z.infer<typeof schema>`로 TypeScript 타입 자동 생성

```typescript
// 재사용 가능한 Zod 스키마
import { z } from 'zod';

export const emailSchema = z.string().email('유효한 이메일 주소를 입력하세요');

export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
  .regex(/[a-z]/, '소문자를 포함해야 합니다')
  .regex(/[A-Z]/, '대문자를 포함해야 합니다')
  .regex(/[0-9]/, '숫자를 포함해야 합니다')
  .regex(/[^a-zA-Z0-9]/, '특수문자를 포함해야 합니다');

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, '이름은 필수 항목입니다').optional(),
});

export type SignupDto = z.infer<typeof signupSchema>;
```

### React Hook Form + Zod 통합

- **zodResolver 사용**: react-hook-form과 Zod 스키마 통합
- **실시간 검증**: `mode: 'onChange'`로 타이핑 중 검증 피드백
- **서버 에러 처리**: `setError`로 서버 검증 에러를 폼에 표시

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const {
  register,
  handleSubmit,
  formState: { errors },
  setError,
} = useForm<SignupDto>({
  resolver: zodResolver(signupSchema),
  mode: 'onChange',
});
```

---

## Dependencies to Add

기존 `specs/00-tech-stack.md`에 명시되지 않은 새 의존성:

### Backend (NestJS)
- **@nestjs/throttler**: `^6.2.1` - Rate limiting
- **nestjs-throttler-storage-redis**: `^0.5.0` - Redis 기반 rate limit 저장소
- **@nestjs/bull**: `^10.2.1` - Redis 큐 통합
- **bull**: `^4.16.3` - 백그라운드 작업 큐
- **nodemailer**: `^6.9.16` - 이메일 발송
- **@types/nodemailer**: `^6.4.16` - TypeScript 타입
- **ioredis**: `^5.4.1` - Redis 클라이언트
- **drizzle-kit**: `^0.28.1` - 마이그레이션 생성 도구

### Frontend (Next.js)
- **@hookform/resolvers**: `^3.9.1` - react-hook-form + Zod 통합

### Development
- **mailhog** (Docker): 로컬 이메일 테스트

**Action Required**: `specs/00-tech-stack.md`에 위 의존성 추가 필요

---

## Security Checklist

- [x] 비밀번호는 Argon2id로 해시 (평문 저장 금지)
- [x] 토큰은 암호학적으로 안전한 난수 생성기 사용
- [x] Rate limiting으로 무차별 대입 공격 차단
- [x] 세션은 Redis에 저장 (즉시 무효화 가능)
- [x] HTTPS 필수 (프로덕션)
- [x] httpOnly 쿠키로 세션 토큰 저장 (XSS 방지)
- [x] CSRF 보호 (NestJS CSRF 미들웨어)
- [x] 이메일 열거 공격 방지 (비밀번호 찾기에서 이메일 존재 여부 노출 금지)
- [x] SQL Injection 방지 (Drizzle ORM 파라미터화 쿼리)
- [x] 입력 검증 (Zod 스키마 양방향 검증)

---

## Performance Considerations

- **Redis 캐싱**: 세션, rate limit 데이터를 Redis에 저장하여 DB 부하 감소
- **인덱싱**: User 테이블의 email 필드에 unique index, 빠른 조회
- **Connection Pooling**: PostgreSQL 연결 풀 설정 (max: 20)
- **비동기 처리**: 이메일 발송은 큐로 처리하여 API 응답 시간 단축
- **로그 배치 쓰기**: AuthLog는 배치로 DB에 쓰기 (성능 최적화)

---

## Summary

모든 기술 결정이 완료되었으며, Technical Context의 "NEEDS CLARIFICATION" 항목이 해결되었습니다. 이제 Phase 1 (데이터 모델, 계약, 빠른 시작 가이드)으로 진행할 준비가 되었습니다.

**Key Decisions**:
1. Argon2id for password hashing
2. Redis-based server sessions
3. Mailhog (dev) + flexible SMTP (prod)
4. Redis + NestJS Throttler for rate limiting
5. BullMQ for email queue
6. crypto.randomBytes for secure tokens
7. Drizzle Kit for migrations

**Dependencies Added**: 8개의 새 패키지 (기술 스택 문서 업데이트 필요)

**Constitution Compliance**: 모든 결정이 8가지 핵심 원칙 준수

