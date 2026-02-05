# Quickstart: User Authentication System

**Feature**: 001-user-auth  
**Date**: 2026-02-05  
**Phase**: Phase 1 - 개발 환경 설정

## 개요

이 가이드는 사용자 인증 시스템을 위한 개발 환경 설정 과정을 안내합니다. 다음 단계를 따라 Next.js, PostgreSQL, Prisma가 포함된 로컬 환경을 실행하세요.

---

## 사전 요구사항

다음이 설치되어 있는지 확인하세요:

- **Node.js**: 20.x 이상 ([다운로드](https://nodejs.org/))
- **npm**: 10.x 이상 (Node.js와 함께 제공)
- **PostgreSQL**: 15.x 이상 ([다운로드](https://www.postgresql.org/download/))
- **Git**: 버전 관리용 ([다운로드](https://git-scm.com/))
- **코드 에디터**: VS Code 권장 (다음 확장 기능 설치):
  - Prisma (Prisma.prisma)
  - ESLint (dbaeumer.vscode-eslint)
  - TypeScript (ms-vscode.vscode-typescript-next)

---

## 1단계: 저장소 복제

```bash
git clone <repository-url>
cd <repository-name>
```

---

## 2단계: 의존성 설치

```bash
npm install
```

다음이 설치됩니다:
- **프레임워크**: Next.js 14+, React 18.2+, TypeScript 5.0+
- **인증**: better-auth (타입 안전 인증 라이브러리)
- **UI 컴포넌트**: shadcn/ui 컴포넌트
- **폼**: react-hook-form 7+, Zod 3.22+
- **데이터베이스**: Drizzle ORM (PostgreSQL용 타입 안전 ORM)
- **캐시/세션**: Redis 클라이언트 (ioredis)
- **개발 도구**: Vitest, Playwright, Storybook, ESLint, Prettier

---

## Step 3: Configure PostgreSQL Database

### Option A: Local PostgreSQL

1. **Start PostgreSQL service**:
   ```bash
   # macOS (Homebrew)
   brew services start postgresql@15
   
   # Linux (systemd)
   sudo systemctl start postgresql
   
   # Windows (pg_ctl)
   pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
   ```

2. **Create database**:
   ```bash
   createdb auth_dev
   ```

3. **Create database user** (optional, for isolation):
   ```sql
   psql postgres
   CREATE USER auth_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE auth_dev TO auth_user;
   \q
   ```

### Option B: Docker PostgreSQL

```bash
docker run --name auth-postgres \
  -e POSTGRES_DB=auth_dev \
  -e POSTGRES_USER=auth_user \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -d postgres:15-alpine
```

---

## Step 4: Configure Redis

### Option A: Local Redis

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Linux (apt)
sudo apt-get install redis-server
sudo systemctl start redis

# Windows (WSL recommended, or use Docker)
```

### Option B: Docker Redis

```bash
docker run --name auth-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

Verify Redis is running:
```bash
redis-cli ping
# Expected output: PONG
```

---

## 5단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
cp .env.example .env.local
```

`.env.local` 편집:

```env
# 데이터베이스
DATABASE_URL="postgresql://auth_user:secure_password@localhost:5432/auth_dev?schema=public"

# Redis (세션 & 캐시)
REDIS_URL="redis://localhost:6379"

# better-auth 설정
BETTER_AUTH_SECRET="your-super-secret-32-char-string-here-change-this"
BETTER_AUTH_URL="http://localhost:3000"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 선택사항: 속도 제한
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=900000
```

**중요**: 
- `BETTER_AUTH_SECRET`을 임의의 32자 문자열로 변경하세요
- 시크릿 생성: `openssl rand -base64 32`
- **`.env.local`을 절대 버전 관리에 커밋하지 마세요**

---

## 6단계: Drizzle ORM 초기화

### Drizzle 설정 파일 생성

`drizzle.config.ts` 파일을 프로젝트 루트에 생성:

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

### 데이터베이스 스키마 생성 및 마이그레이션

```bash
# 마이그레이션 파일 생성
npx drizzle-kit generate:pg

# 데이터베이스에 마이그레이션 적용
npx drizzle-kit push:pg

# 선택사항: Drizzle Studio 열기 (GUI 데이터베이스 브라우저)
npx drizzle-kit studio
```

**예상 출력**:
```
📦 Generating migrations...
✔ Migrations generated successfully

drizzle/migrations/
  └─ 0000_init.sql

✔ Applying migrations...
✔ Migration applied successfully
```

**Drizzle Studio** (https://local.drizzle.studio):
- 데이터베이스 GUI 도구
- 테이블 조회 및 편집
- 실시간 스키마 탐색

---

## 7단계: shadcn/ui 컴포넌트 설정

shadcn/ui 초기화:

```bash
npx shadcn-ui@latest init
```

When prompted, choose:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Install required components:

```bash
npx shadcn-ui@latest add button input form label card
```

---

## Step 8: Verify Database Schema

Check that tables were created:

```bash
psql auth_dev -c "\dt"
```

Expected tables:
- `users`
- `sessions`
- `_prisma_migrations` (Prisma internal)

---

## Step 9: Start Development Server

```bash
npm run dev
```

**예상 출력**:
```
 ▲ Next.js 14.x
 - Local:        http://localhost:3000
 - ready started server on 0.0.0.0:3000
```

---

## 10단계: 설치 확인

브라우저를 열고 다음 주소로 이동:

- **홈**: http://localhost:3000
- **회원가입**: http://localhost:3000/signup
- **로그인**: http://localhost:3000/login

인증 페이지가 표시되어야 합니다.

---

## 개발 워크플로우

### 개발 서버 실행

```bash
npm run dev
```

### Storybook 실행 (컴포넌트 개발)

```bash
npm run storybook
```

http://localhost:6006에서 Storybook이 열려 격리된 컴포넌트 개발이 가능합니다.

### 테스트 실행

```bash
# 단위 테스트 (Vitest)
npm run test

# E2E 테스트 (Playwright)
npm run test:e2e

# 워치 모드 (TDD용)
npm run test:watch
```

### 데이터베이스 관리

```bash
# 새 마이그레이션 생성
npx drizzle-kit generate:pg

# 마이그레이션 적용
npx drizzle-kit push:pg

# 데이터베이스 초기화 (경고: 모든 데이터 삭제)
npx drizzle-kit drop

# Drizzle Studio에서 데이터 확인
npx drizzle-kit studio

# 마이그레이션 실행 (프로덕션)
npm run db:migrate
```

### 코드 품질

```bash
# 코드 린트
npm run lint

# 코드 포맷
npm run format

# 타입 체크
npm run type-check
```

---

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── profile/           # Profile page
│   │   ├── api/auth/[...all]/ # better-auth API handler
│   │   └── layout.tsx         # Root layout
│   ├── lib/                   # Utilities and services
│   │   ├── db/                # Prisma database client
│   │   ├── auth/              # better-auth configuration
│   │   ├── redis/             # Redis client
│   │   └── validations/       # Zod schemas
│   ├── components/            # React components
│   │   ├── auth/              # Auth forms
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   └── middleware.ts          # Auth middleware
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── tests/
│   ├── e2e/                   # Playwright E2E tests
│   └── unit/                  # Vitest unit tests
├── stories/                   # Storybook stories
├── .storybook/                # Storybook config
├── .env.local                 # Environment variables (not in git)
├── .env.example               # Example env file
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

---

## 일반 명령어 참조

| 명령어 | 설명 |
|---------|-------------|
| `npm run dev` | 개발 서버 시작 |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 시작 |
| `npm run test` | 단위 테스트 실행 |
| `npm run test:e2e` | E2E 테스트 실행 |
| `npm run storybook` | Storybook 시작 |
| `npm run build-storybook` | Storybook 빌드 |
| `npm run lint` | 코드 린트 |
| `npx drizzle-kit studio` | 데이터베이스 GUI 열기 |
| `npx drizzle-kit generate:pg` | 마이그레이션 생성 |
| `npx drizzle-kit push:pg` | 마이그레이션 적용 |
| `npm run db:migrate` | 마이그레이션 실행 (프로덕션) |
| `npx shadcn-ui@latest add <component>` | shadcn/ui 컴포넌트 추가 |

---

## Troubleshooting

### Issue: Prisma Client not found

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npx prisma generate
```

---

### Issue: Database connection failed

**Error**: `Can't reach database server at localhost:5432`

**Solution**:
1. Verify PostgreSQL is running: `psql -U auth_user -d auth_dev`
2. Check `DATABASE_URL` in `.env.local`
3. Ensure firewall allows connection on port 5432

---

### Issue: Migration fails with "relation already exists"

**Error**: `relation "users" already exists`

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

### Issue: Port 3000 already in use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Option 1: Kill process using port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows (find PID, then taskkill /PID <pid> /F)

# Option 2: Use different port
PORT=3001 npm run dev
```

---

### Issue: TypeScript errors in IDE

**Solution**:
1. Restart TypeScript server: VS Code → Command Palette → "TypeScript: Restart TS Server"
2. Regenerate Prisma Client: `npx prisma generate`
3. Rebuild project: `npm run build`

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Yes | Redis connection URL | `redis://localhost:6379` |
| `BETTER_AUTH_SECRET` | Yes | Secret for encrypting sessions | 32-char random string |
| `BETTER_AUTH_URL` | Yes | Base URL of application | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | No | Public-facing app URL | `http://localhost:3000` |
| `RATE_LIMIT_MAX_ATTEMPTS` | No | Max failed login attempts | `5` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in milliseconds | `900000` (15 min) |

---

## Next Steps

After completing this quickstart:

1. Review [data-model.md](./data-model.md) for database schema details
2. Review [contracts/](./contracts/) for API specifications
3. See [plan.md](./plan.md) for implementation phases
4. Run `/speckit.tasks` to generate implementation tasks
5. Start implementing following TDD workflow (tests → approval → implementation)

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Set strong `BETTER_AUTH_SECRET` (32+ random characters)
- [ ] Use managed PostgreSQL service (RDS, Cloud SQL, Supabase, etc.)
- [ ] Use managed Redis service (ElastiCache, Redis Cloud, Upstash, etc.)
- [ ] Enable SSL for database connections
- [ ] Set `BETTER_AUTH_URL` to production domain (HTTPS)
- [ ] Configure CORS for frontend domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable rate limiting in production
- [ ] Set up monitoring (error tracking, performance)
- [ ] Configure automated backups
- [ ] Review security headers (Next.js config)
- [ ] Set up CI/CD pipeline (tests, linting, migrations)
- [ ] Test auth flows in staging environment

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [better-auth Documentation](https://better-auth.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Redis Documentation](https://redis.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Storybook Documentation](https://storybook.js.org/)

---

## Support

If you encounter issues not covered in this guide:

1. Check existing GitHub issues
2. Review error logs: `tail -f .next/server.log`
3. Enable debug mode: `DEBUG=* npm run dev`
4. Consult feature spec: [spec.md](./spec.md)

---

**Status**: Ready for development 🚀

Start implementing by running `/speckit.tasks` to generate actionable task list.
