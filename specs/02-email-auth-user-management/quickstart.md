# Quickstart Guide: 이메일 기반 회원가입 및 회원관리

**Feature**: 002-email-auth-user-management  
**Date**: 2026-02-09  
**Audience**: Developers implementing this feature

---

## 개요

이 가이드는 이메일 기반 인증 시스템을 빠르게 구현하고 테스트하기 위한 단계별 지침을 제공합니다.

**목표**: 30분 내에 로컬 환경에서 회원가입 → 이메일 인증 → 로그인 플로우를 작동시키기

---

## 전제 조건

### 필수 도구
- **Node.js**: 22.x LTS
- **pnpm**: ^8.6.0 (패키지 매니저 & 런타임)
- **turbo**: ^2.x (Turborepo CLI - 자동 설치됨)
- **Docker**: 27.x
- **Docker Compose**: 2.x
- **Git**: 2.x

### 개발 환경 확인
```bash
# 버전 확인
node --version    # v22.x.x
pnpm --version     # ^8.6.0
docker --version  # Docker version 27.x.x
```

**Note**: Turborepo는 프로젝트 의존성으로 설치되므로 별도 글로벌 설치 불필요

---

## Step 1: 환경 설정 (5분)

### 1.1 저장소 클론 및 의존성 설치

```bash
# 저장소 클론 (이미 클론했다면 건너뛰기)
git clone <repository-url>
cd taste_spec_kit

# Turborepo 워크스페이스 의존성 설치
# Root + 모든 apps/packages의 의존성을 한 번에 설치
pnpm install

# 설치 확인 (Turborepo CLI가 사용 가능해짐)
pnpm turbo --version
```

**Turborepo 워크스페이스 구조**:
```
taste_spec_kit/
├── apps/
│   ├── api/          # NestJS 백엔드
│   └── web/          # Next.js 프론트엔드
├── packages/
│   ├── database/     # Drizzle ORM 스키마
│   ├── types/        # 공유 타입
│   ├── validators/   # Zod 스키마
│   ├── ui/           # 공유 UI 컴포넌트
│   └── config/       # 공유 설정
└── package.json      # Root workspace
```

### 1.2 Docker 서비스 시작

```bash
# PostgreSQL, Redis, Mailhog 시작
docker-compose up -d

# 서비스 확인
docker-compose ps

# 예상 출력:
# NAME                SERVICE    STATUS
# postgres           postgres   Up
# redis              redis      Up
# mailhog            mailhog    Up
```

**서비스 포트**:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Mailhog UI: `http://localhost:8025` (이메일 확인용)
- Mailhog SMTP: `localhost:1025`

### 1.3 환경 변수 설정

```bash
# .env.local 파일 생성
cp .env.example .env.local
```

**`.env.local` 편집** (주요 설정):
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taste_spec_kit

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (로컬 개발용 Mailhog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
EMAIL_FROM=noreply@example.com

# Frontend URL (이메일 링크용)
FRONTEND_URL=http://localhost:3000

# better-auth 설정
AUTH_SECRET=your-secret-key-here-change-this-in-production
SESSION_EXPIRES_IN=604800  # 7 days in seconds

# TypeScript strict mode
TS_NODE_PROJECT=tsconfig.json
```

---

## Step 2: 데이터베이스 설정 (5분)

### 2.1 마이그레이션 실행

```bash
# @repo/database 패키지에서 마이그레이션 실행
# Turborepo를 통해 실행 (의존성 자동 관리)
pnpm turbo run db:migrate

# 또는 직접 실행
cd packages/database
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push:pg

# 성공 메시지 확인:
# ✓ Migrations applied successfully
```

**Note**: `@repo/database` 패키지가 데이터베이스 스키마와 마이그레이션의 SSOT입니다.

### 2.2 데이터베이스 확인

```bash
# PostgreSQL 접속
docker exec -it postgres psql -U user -d taste_spec_kit

# 테이블 확인
\dt

# 예상 출력:
#  public | users
#  public | email_verification_tokens
#  public | password_reset_tokens
#  public | auth_logs

# 종료
\q
```

---

## Step 3: 백엔드 서버 시작 (5분)

### 3.1 NestJS 백엔드 실행

```bash
# 프로젝트 루트에서 Turborepo로 실행 (권장)
pnpm turbo run dev --filter=api

# 또는 직접 실행
cd apps/api
pnpm run dev

# 예상 출력:
# [Nest] 12345 - Starting Nest application...
# [Nest] 12345 - AuthModule dependencies initialized
# [Nest] 12345 - UserModule dependencies initialized
# [Nest] 12345 - EmailModule dependencies initialized
# [Nest] 12345 - Nest application successfully started
# [Nest] 12345 - Application is running on: http://localhost:3001
```

**백엔드 포트**: `http://localhost:3001`

**Turborepo 이점**: `--filter=api` 옵션으로 의존성 패키지(`@repo/database`, `@repo/types` 등)가 자동으로 빌드됩니다.

### 3.2 헬스 체크

```bash
# 새 터미널에서
curl http://localhost:3001/health

# 예상 응답:
# {"status":"ok","database":"connected","redis":"connected"}
```

---

## Step 4: 프론트엔드 서버 시작 (5분)

### 4.1 Next.js 프론트엔드 실행

```bash
# 프로젝트 루트에서 Turborepo로 실행 (권장)
pnpm turbo run dev --filter=web

# 또는 직접 실행
cd apps/web
pnpm run dev

# 예상 출력:
#   ▲ Next.js 15.1.0
#   - Local:        http://localhost:3000
#   - ready in 1.2s
```

**프론트엔드 포트**: `http://localhost:3000`

### 4.2 백엔드 + 프론트엔드 동시 실행 (선택 사항)

```bash
# 프로젝트 루트에서 모든 앱을 병렬로 실행
pnpm turbo run dev

# 또는 특정 앱만 병렬 실행
pnpm turbo run dev --filter=api --filter=web

# Turborepo가 자동으로:
# - 의존성 패키지 빌드 (@repo/*)
# - API와 Web을 병렬 실행
# - 파일 변경 감지 및 Hot Reload
```

**Turborepo 병렬 실행 이점**:
- 의존성 그래프에 따라 순서대로 빌드
- 변경된 패키지만 재빌드 (캐시 활용)
- 여러 앱을 하나의 터미널에서 관리

---

## Step 5: 기능 테스트 (10분)

### 5.1 회원가입 테스트

1. **회원가입 페이지 접속**:
   ```
   http://localhost:3000/signup
   ```

2. **회원가입 폼 작성**:
   - 이메일: `test@example.com`
   - 비밀번호: `SecureP@ss123`
   - 이름: `테스트 유저` (선택 사항)

3. **제출 후 확인**:
   - 성공 메시지: "이메일 인증 링크를 발송했습니다"

4. **이메일 확인** (Mailhog):
   - 브라우저에서 `http://localhost:8025` 접속
   - 이메일 인증 링크가 있는 이메일 확인
   - 인증 링크 클릭 (또는 토큰 복사)

### 5.2 이메일 인증 테스트

1. **인증 링크 클릭**:
   ```
   http://localhost:3000/verify-email?token=<token-from-email>
   ```

2. **성공 메시지 확인**:
   - "계정이 활성화되었습니다. 로그인해주세요"
   - 자동으로 로그인 페이지로 리다이렉트

### 5.3 로그인 테스트

1. **로그인 페이지 접속**:
   ```
   http://localhost:3000/login
   ```

2. **로그인 정보 입력**:
   - 이메일: `test@example.com`
   - 비밀번호: `SecureP@ss123`

3. **로그인 성공 확인**:
   - 대시보드 페이지로 리다이렉트
   - 사용자 이름 표시 확인

### 5.4 프로필 조회 및 수정 테스트

1. **프로필 페이지 접속**:
   ```
   http://localhost:3000/profile
   ```

2. **프로필 정보 확인**:
   - 이메일, 이름, 가입일 표시

3. **이름 수정**:
   - 이름을 "수정된 이름"으로 변경
   - 저장 후 변경 확인

### 5.5 로그아웃 테스트

1. **로그아웃 버튼 클릭**

2. **로그인 페이지로 리다이렉트 확인**

3. **보호된 페이지 접근 시도**:
   ```
   http://localhost:3000/profile
   ```
   → 로그인 페이지로 자동 리다이렉트

---

## Step 6: API 직접 테스트 (선택 사항)

### 6.1 cURL로 회원가입

```bash
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "SecureP@ss456",
    "name": "테스트 유저2"
  }'

# 예상 응답:
# {
#   "success": true,
#   "data": {
#     "userId": "550e8400-e29b-41d4-a716-446655440000",
#     "email": "test2@example.com",
#     "name": "테스트 유저2",
#     "message": "이메일 인증 링크를 발송했습니다"
#   }
# }
```

### 6.2 cURL로 로그인

```bash
# 먼저 이메일 인증 완료 후 (Mailhog에서 토큰 복사하여 GET 요청)
curl -X GET "http://localhost:3001/api/v1/auth/verify-email?token=<token>"

# 로그인
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "SecureP@ss456"
  }' \
  -c cookies.txt  # 쿠키 저장

# 예상 응답:
# {
#   "success": true,
#   "data": {
#     "user": {
#       "id": "550e8400-e29b-41d4-a716-446655440000",
#       "email": "test2@example.com",
#       "name": "테스트 유저2",
#       "emailVerified": true
#     },
#     "sessionToken": "..."
#   }
# }
```

### 6.3 cURL로 프로필 조회

```bash
curl http://localhost:3001/api/v1/users/profile \
  -b cookies.txt  # 저장된 쿠키 사용

# 예상 응답:
# {
#   "success": true,
#   "data": {
#     "id": "550e8400-e29b-41d4-a716-446655440000",
#     "email": "test2@example.com",
#     "name": "테스트 유저2",
#     "emailVerified": true,
#     "isActive": true,
#     "createdAt": "2026-02-09T10:30:00Z",
#     "updatedAt": "2026-02-09T10:30:00Z"
#   }
# }
```

---

## Step 7: E2E 테스트 실행 (선택 사항)

### 7.1 Playwright E2E 테스트

```bash
# 프로젝트 루트에서
pnpm run test:e2e

# 특정 테스트만 실행
pnpm run test:e2e -- --grep "signup"

# 헤드리스 모드 해제 (브라우저 표시)
pnpm run test:e2e -- --headed
```

### 7.2 테스트 커버리지 확인

```bash
# 커버리지 리포트 생성
pnpm run test:coverage

# 브라우저에서 리포트 열기
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

---

## 일반적인 문제 해결

### 문제 1: Docker 컨테이너가 시작되지 않음

```bash
# 포트 충돌 확인
netstat -an | grep 5432  # PostgreSQL
netstat -an | grep 6379  # Redis

# 컨테이너 재시작
docker-compose down
docker-compose up -d
```

### 문제 2: 데이터베이스 연결 실패

```bash
# PostgreSQL 로그 확인
docker logs postgres

# 연결 테스트
docker exec -it postgres psql -U user -d taste_spec_kit -c "SELECT 1"
```

### 문제 3: 이메일이 발송되지 않음

```bash
# Mailhog 로그 확인
docker logs mailhog

# Mailhog UI 접속
open http://localhost:8025  # macOS
start http://localhost:8025 # Windows

# 환경 변수 확인
echo $SMTP_HOST  # localhost
echo $SMTP_PORT  # 1025
```

### 문제 4: 세션이 유지되지 않음

```bash
# Redis 연결 확인
docker exec -it redis redis-cli ping
# 예상: PONG

# 세션 키 확인
docker exec -it redis redis-cli KEYS "session:*"

# 환경 변수 확인
echo $REDIS_HOST  # localhost
echo $REDIS_PORT  # 6379
```

### 문제 5: TypeScript 타입 에러

```bash
# 타입 정의 재생성
cd backend
pnpm drizzle-kit generate:pg

# TypeScript 체크
pnpm run type-check
```

---

## 개발 워크플로우

### Turborepo 명령어

```bash
# 모든 앱/패키지 개발 서버 시작
pnpm turbo run dev

# 특정 앱만 실행
pnpm turbo run dev --filter=api
pnpm turbo run dev --filter=web

# 모든 패키지 빌드
pnpm turbo run build

# 모든 테스트 실행 (병렬)
pnpm turbo run test

# 모든 패키지 린트
pnpm turbo run lint

# 타입 체크
pnpm turbo run type-check

# 특정 패키지만 빌드 (의존성 자동 처리)
pnpm turbo run build --filter=@repo/database

# 캐시 초기화 (문제 발생 시)
pnpm turbo run build --force
```

### 코드 변경 후 자동 재시작

- **백엔드 (apps/api)**: NestJS가 파일 변경 감지하여 자동 재시작
- **프론트엔드 (apps/web)**: Next.js가 Hot Module Replacement (HMR)로 즉시 반영
- **공유 패키지 (packages/*)**: Turborepo가 변경 감지 후 의존하는 앱 자동 재빌드
- **데이터베이스**: 스키마 변경 시 마이그레이션 재생성 필요

```bash
# 스키마 변경 후 (@repo/database)
cd packages/database
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push:pg

# Turborepo로 실행 시 의존 앱 자동 재시작
```

### 패키지 간 의존성

**apps/api**가 사용하는 패키지:
- `@repo/database` - 데이터베이스 스키마
- `@repo/types` - 공유 타입
- `@repo/validators` - Zod 검증 스키마

**apps/web**이 사용하는 패키지:
- `@repo/types` - 공유 타입
- `@repo/validators` - 클라이언트 검증
- `@repo/ui` - 공유 UI 컴포넌트

**Turborepo가 자동 처리**:
1. 패키지 변경 감지
2. 의존성 그래프 계산
3. 영향받는 앱만 재빌드
4. 병렬 실행으로 빌드 시간 단축

### Git 워크플로우

```bash
# 기능 브랜치 생성
git checkout -b feature/001-email-auth-additional-work

# 변경사항 커밋
git add .
git commit -m "feat: Add email resend functionality"

# 푸시 및 PR 생성
git push origin feature/001-email-auth-additional-work
```

---

## 다음 단계

### 1. 작업 분해 (Tasks)
```bash
# tasks.md 생성
# /speckit.tasks 명령 실행 또는 수동 작성
```

### 2. 구현 시작
- P1 작업부터 시작 (회원가입, 로그인)
- 각 작업 완료 후 E2E 테스트 추가
- Constitution Check 재검증

### 3. 추가 기능
- 비밀번호 재설정 (P2)
- 프로필 관리 (P2)
- 계정 비활성화 (P3)

---

## 참고 자료

### 프로젝트 문서
- [Feature Spec](./spec.md)
- [Implementation Plan](./plan.md)
- [Research](./research.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/)

### 기술 문서
- [better-auth Documentation](https://better-auth.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Zod Documentation](https://zod.dev)

### 기술 스택
- [Tech Stack Specification](../../00-tech-stack.md)
- [Project Constitution](../../../.specify/memory/constitution.md)

---

## 요약

✅ **완료 체크리스트**:
- [ ] Docker 서비스 실행 (PostgreSQL, Redis, Mailhog)
- [ ] 환경 변수 설정 (.env.local)
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 백엔드 서버 시작 (http://localhost:3001)
- [ ] 프론트엔드 서버 시작 (http://localhost:3000)
- [ ] 회원가입 → 이메일 인증 → 로그인 플로우 테스트
- [ ] API 엔드포인트 테스트 (선택 사항)
- [ ] E2E 테스트 실행 (선택 사항)

**소요 시간**: ~30분 (문제 해결 제외)

**다음**: `tasks.md` 생성하여 구현 작업 분해 시작

