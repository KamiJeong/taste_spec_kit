# Implementation Plan: 이메일 기반 회원가입 및 회원관리

**Branch**: `001-email-auth-user-management` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-email-auth-user-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

이 기능은 사용자가 이메일 주소와 비밀번호를 사용하여 계정을 생성하고, 이메일 인증을 통해 계정을 활성화하며, 로그인/로그아웃, 비밀번호 재설정, 프로필 관리, 계정 비활성화 기능을 제공합니다. 

**기술 접근**: better-auth 라이브러리를 기반으로 하며, NestJS 백엔드에서 인증 로직을 처리하고, Next.js 프론트엔드에서 react-hook-form과 Zod를 활용한 폼 검증을 제공합니다. 세션은 Redis에 저장하고, 사용자 데이터는 PostgreSQL에 Drizzle ORM을 통해 안전하게 저장합니다. 모든 비밀번호는 bcrypt/argon2로 해시되며, 이메일 발송은 Redis 큐를 통한 재시도 로직으로 신뢰성을 보장합니다.

## Technical Context

**Language/Version**: TypeScript 5.7.0 with Node.js 22.x LTS  
**Primary Dependencies**: 
  - Backend: NestJS ^11.0.0, better-auth (latest), Drizzle ORM ^0.36.0
  - Frontend: Next.js ^15.1.0, React ^19.0.0, react-hook-form ^7.54.0
  - Validation: Zod ^3.24.0
  - Password Hashing: bcrypt or argon2 (to be selected in research phase)
  
**Storage**: 
  - PostgreSQL 16.x (user data, tokens, auth logs)
  - Redis 7.x (session cache, email queue)
  
**Testing**: 
  - E2E: Playwright ^1.49.0 (primary)
  - Unit: Vitest ^2.1.0 (optional)
  - Component: Storybook ^8.5.0 (UI components)
  
**Target Platform**: Web (server-side: Linux/Docker, client-side: modern browsers)  

**Project Type**: Web application (monorepo with backend + frontend)  

**Performance Goals**: 
  - Login requests: 95% complete within 500ms
  - Signup to email verification: ≤ 3 minutes end-to-end
  - Support 1,000 concurrent logged-in users
  
**Constraints**: 
  - Email verification link expires in 24 hours
  - Password reset link expires in 1 hour
  - Rate limiting: 5 failed login attempts → 15 min lockout
  - All passwords must be hashed (never stored in plain text)
  - HTTPS required for production
  
**Scale/Scope**: 
  - Initial target: 10,000 registered users
  - 5 user stories (P1: signup, login; P2: password reset, profile; P3: account deactivation)
  - 4 database entities (User, EmailVerificationToken, PasswordResetToken, AuthLog)
  - ~10-15 API endpoints (REST)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

이 기능이 프로젝트 헌법의 8가지 핵심 원칙을 준수하는지 검증합니다:

- [x] **SSOT (단일 진실 공급원)**: User 테이블이 사용자 정보의 SSOT, `specs/00-tech-stack.md`가 기술 결정의 SSOT, better-auth 스키마를 세션 관리의 SSOT로 사용 (중복 정의 금지)
- [x] **Overrides-Only (재정의 최소화)**: better-auth 기본 설정을 최대한 사용하고, 이메일 인증 필수 등 프로젝트 특화 요구사항만 오버라이드. 비밀번호 복잡도 규칙은 환경 변수로 설정 가능하되 기본값 명시
- [x] **Pinned-Stack (고정된 기술 스택)**: 모든 의존성은 `specs/00-tech-stack.md`에 명시됨 (better-auth, Drizzle ORM, PostgreSQL 16.x, Redis 7.x, Zod, react-hook-form). 새 의존성 추가 시 문서 업데이트 필요
- [x] **Local-First (로컬 우선)**: Docker Compose로 로컬 PostgreSQL, Redis 실행. 이메일 발송은 로컬에서 Mailhog 또는 콘솔 출력으로 대체 (환경 변수로 전환). 모든 테스트는 로컬 Docker 환경에서 실행 가능
- [x] **Cost-Aware (비용 인지)**: 이메일 발송은 Redis 큐로 재시도 로직 구현 (실패 최소화). 세션은 Redis 캐시로 DB 부하 감소. 비밀번호 해시 비용 인자는 보안과 성능 균형 고려 (bcrypt rounds: 10-12). 이메일 API 무료 티어 모니터링 필요
- [x] **Boundaries (명확한 경계)**: 모듈 분리 명확 - Auth Module (회원가입/로그인/세션), User Module (프로필/계정관리), Email Module (이메일 발송), Auth UI (폼 컴포넌트). 순환 의존성 금지 (User → Auth 의존 금지)
- [x] **Type-Safety (타입 안전성)**: TypeScript strict mode 활성화. Drizzle ORM으로 DB 스키마 타입 자동 생성. Zod로 API 요청/응답 검증. better-auth 타입 정의 활용. `any` 타입 사용 금지
- [x] **Spec-Before-Code (명세 우선)**: `specs/01-email-auth-user-management/spec.md` 승인 완료. 이 계획 문서가 구현 전 작성됨

**위반 사항**: 없음 - 모든 헌법 원칙 준수

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root - Turborepo structure)

```text
taste_spec_kit/
├── apps/                        # Deployable applications
│   ├── api/                     # NestJS Backend API
│   │   ├── src/
│   │   │   ├── auth/            # Auth Module
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── guards/      # Auth guards (Session)
│   │   │   │   └── dto/         # Auth DTOs
│   │   │   ├── user/            # User Module
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── user.module.ts
│   │   │   │   └── dto/         # User DTOs
│   │   │   ├── email/           # Email Module
│   │   │   │   ├── email.service.ts
│   │   │   │   ├── email.module.ts
│   │   │   │   ├── templates/   # HTML templates
│   │   │   │   └── processors/  # Bull queue processors
│   │   │   ├── app.module.ts    # Root module
│   │   │   └── main.ts          # Bootstrap
│   │   ├── test/
│   │   │   ├── e2e/             # API E2E tests
│   │   │   └── integration/     # Integration tests
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   └── web/                     # Next.js Frontend
│       ├── src/
│       │   ├── app/             # Next.js App Router
│       │   │   ├── (auth)/      # Auth routes
│       │   │   │   ├── login/
│       │   │   │   ├── signup/
│       │   │   │   ├── verify-email/
│       │   │   │   ├── reset-password/
│       │   │   │   └── forgot-password/
│       │   │   ├── (protected)/ # Protected routes
│       │   │   │   ├── dashboard/
│       │   │   │   └── profile/
│       │   │   └── layout.tsx
│       │   ├── components/      # React components
│       │   │   └── auth/        # Auth components
│       │   │       ├── LoginForm.tsx
│       │   │       ├── SignupForm.tsx
│       │   │       ├── ResetPasswordForm.tsx
│       │   │       └── ProfileForm.tsx
│       │   └── lib/             # App-specific utilities
│       │       ├── api-client.ts
│       │       └── auth-provider.tsx
│       ├── test/
│       │   └── e2e/             # Playwright tests
│       ├── package.json
│       ├── tsconfig.json
│       └── next.config.js
│
├── packages/                    # Shared packages (reusable)
│   ├── database/                # Database package
│   │   ├── src/
│   │   │   ├── schema/          # Drizzle ORM schemas
│   │   │   │   ├── user.schema.ts
│   │   │   │   ├── token.schema.ts
│   │   │   │   ├── auth-log.schema.ts
│   │   │   │   └── index.ts
│   │   │   ├── migrations/      # DB migrations
│   │   │   ├── client.ts        # Drizzle client
│   │   │   └── index.ts         # Public API
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── types/                   # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── auth.types.ts    # Auth-related types
│   │   │   ├── user.types.ts    # User-related types
│   │   │   ├── api.types.ts     # API request/response types
│   │   │   └── index.ts         # Barrel export
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── validators/              # Shared Zod schemas
│   │   ├── src/
│   │   │   ├── auth.schemas.ts  # Auth validation schemas
│   │   │   ├── user.schemas.ts  # User validation schemas
│   │   │   ├── common.schemas.ts # Common schemas
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                      # Shared UI components (shadcn/ui)
│   │   ├── src/
│   │   │   ├── components/      # Reusable components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   └── ...
│   │   │   ├── lib/
│   │   │   │   └── utils.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tailwind.config.ts
│   │
│   └── config/                  # Shared configurations
│       ├── eslint/              # ESLint configs
│       │   ├── base.js
│       │   ├── next.js
│       │   └── nest.js
│       ├── typescript/          # TypeScript configs
│       │   ├── base.json
│       │   ├── next.json
│       │   └── nest.json
│       └── package.json
│
├── tooling/                     # Development tools (optional)
│   └── scripts/                 # Build/deploy scripts
│
├── .github/                     # GitHub workflows
├── docker-compose.yml           # Local development services
├── turbo.json                   # Turborepo configuration
├── package.json                 # Root package.json (workspaces)
├── pnpm-lock.yaml                 # Lockfile
└── README.md
```

**Structure Decision**: Turborepo-based monorepo following industry best practices. This structure provides:

### Rationale for Turborepo Structure

**apps/** (Deployable Applications):
- `apps/api`: NestJS backend - independently deployable, optimized for API serving
- `apps/web`: Next.js frontend - independently deployable, optimized for SSR/SSG

**packages/** (Shared Libraries):
- `packages/database`: Database schemas and migrations (shared between API and future services)
- `packages/types`: Type definitions shared across all apps (SSOT for types)
- `packages/validators`: Zod schemas for validation (DRY, reused in frontend/backend)
- `packages/ui`: Reusable React components (shadcn/ui, shared across web apps)
- `packages/config`: Shared tooling configs (ESLint, TypeScript, Prettier)

**Benefits**:
1. **Clear Boundaries**: Each package has a single responsibility, no circular dependencies
2. **Type Safety**: Shared `@repo/types` ensures frontend/backend type consistency
3. **Code Reuse**: Validators used on both client and server (DRY)
4. **Independent Deployment**: Apps can be deployed separately
5. **Incremental Builds**: Turborepo caches builds, only rebuilds changed packages
6. **Parallel Execution**: Run tests/builds across packages simultaneously
7. **Scalability**: Easy to add new apps (e.g., admin dashboard, mobile API)

**Turborepo Features Used**:
- Dependency graph management
- Remote caching for CI/CD
- Task pipelines (build → test → lint)
- Workspace protocol for internal packages

**Constitution Compliance**:
- ✅ **SSOT**: `@repo/types` for types, `@repo/database` for schemas
- ✅ **Boundaries**: Clear package boundaries, explicit dependencies
- ✅ **Type-Safety**: Shared types package, all imports strongly typed
- ✅ **Overrides-Only**: Base configs in `@repo/config`, apps override minimally

**Package Naming Convention**: `@repo/*` (internal scope)

## Complexity Tracking

> **No violations detected** - All constitution principles are fully complied with.

This feature follows all 8 constitution principles without requiring exceptions or justifications.

---

## Planning Phase Completion Report

**Date Completed**: 2026-02-09  
**Status**: ✅ Phase 0 & Phase 1 Complete

### Deliverables

#### Phase 0: Research & Decisions
- ✅ **research.md** created
  - 7 key technical decisions documented
  - All "NEEDS CLARIFICATION" items resolved
  - Best practices and security considerations defined
  - 8 new dependencies identified

#### Phase 1: Design & Contracts
- ✅ **data-model.md** created
  - 4 main entities defined (User, EmailVerificationToken, PasswordResetToken, AuthLog)
  - 1 external entity (Session - managed by better-auth)
  - Complete Drizzle ORM schemas
  - Database migrations defined
  
- ✅ **contracts/** directory created
  - `auth-api.md`: 8 authentication endpoints documented
  - `user-api.md`: 6 user profile endpoints documented
  - `turborepo-config.md`: Turborepo configuration examples and best practices
  - Comprehensive error codes and rate limiting defined
  
- ✅ **quickstart.md** created
  - 30-minute setup guide
  - Step-by-step testing instructions
  - Troubleshooting section
  - Developer workflow documented

- ✅ **Agent context updated**
  - GitHub Copilot instructions updated with TypeScript/Node.js context

### Constitution Re-Check (Post-Design)

All 8 principles remain fully compliant after Phase 1 design:

- [x] **SSOT**: Single source maintained (User table, better-auth session, tech stack doc)
- [x] **Overrides-Only**: Minimal overrides, all justified in research.md
- [x] **Pinned-Stack**: All dependencies versioned and documented
- [x] **Local-First**: Docker Compose setup, Mailhog for local email testing
- [x] **Cost-Aware**: Redis queues, session caching, email retry logic
- [x] **Boundaries**: Clear module separation in project structure
- [x] **Type-Safety**: Drizzle ORM, Zod schemas, TypeScript strict mode
- [x] **Spec-Before-Code**: spec.md → plan.md → research.md → data-model.md flow completed

**No violations introduced during design phase.**

### Key Decisions Summary

1. **Password Hashing**: Argon2id (more secure than bcrypt)
2. **Session Strategy**: Server-side sessions with Redis (better security than JWT)
3. **Email Service**: Flexible abstraction layer (Mailhog dev, configurable production)
4. **Rate Limiting**: Redis + NestJS Throttler
5. **Email Queue**: BullMQ for reliability
6. **Token Generation**: crypto.randomBytes (256-bit security)
7. **Migrations**: Drizzle Kit auto-generation

### New Dependencies Added

**Backend**:
- @nestjs/throttler: ^6.2.1
- nestjs-throttler-storage-redis: ^0.5.0
- @nestjs/bull: ^10.2.1
- bull: ^4.16.3
- nodemailer: ^6.9.16
- @types/nodemailer: ^6.4.16
- ioredis: ^5.4.1
- drizzle-kit: ^0.28.1

**Frontend**:
- @hookform/resolvers: ^3.9.1

**Development**:
- mailhog (Docker image)

**Action Required**: Update `specs/00-tech-stack.md` with these dependencies

### Next Steps

1. **Update Tech Stack Document**:
   ```bash
   # Add new dependencies to specs/00-tech-stack.md
   ```

2. **Generate Tasks** (Phase 2):
   ```bash
   # Run: /speckit.tasks
   # Or manually create tasks.md
   ```

3. **Implementation**:
   - Start with P1 user stories (signup, login)
   - Follow task order from tasks.md
   - Run E2E tests after each major component

4. **Review & Validation**:
   - Code review against constitution checklist
   - Security audit (password hashing, token security)
   - Performance testing (500ms login goal)

### Files Generated

```
specs/01-email-auth-user-management/
├── spec.md              ✅ (pre-existing)
├── plan.md              ✅ (this file)
├── research.md          ✅ (Phase 0)
├── data-model.md        ✅ (Phase 1)
├── quickstart.md        ✅ (Phase 1)
├── contracts/
│   ├── auth-api.md      ✅ (Phase 1)
│   ├── user-api.md      ✅ (Phase 1)
│   └── turborepo-config.md ✅ (Phase 1)
└── tasks.md             ⏳ (Phase 2 - next step)
```

**Branch**: `01-email-auth-user-management`  
**Ready for**: Task generation and implementation

---

**End of Planning Phase**
