# Tasks: 이메일 기반 회원가입 및 회원관리

**Feature**: 001-email-auth-user-management  
**Input**: Design documents from `/specs/01-email-auth-user-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, turborepo-config.md

**Tests**: Tests are NOT explicitly requested in the feature specification, therefore test tasks are EXCLUDED from this plan. Focus on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Constitution-Aware Task Types

작업 계획 시 헌법 원칙을 반영:

- **SSOT 작업**: User 테이블, @repo/types, @repo/database가 각각 SSOT
- **Type-Safety 작업**: TypeScript strict mode, Drizzle ORM, Zod 검증
- **Boundaries 작업**: 모듈 분리 (Auth, User, Email), @repo/* 패키지
- **Local-First 작업**: Docker Compose, Mailhog, 로컬 개발 환경
- **Cost-Aware 작업**: Redis 캐싱, 이메일 큐, 세션 최적화
- **Spec-Before-Code**: spec.md → plan.md → tasks.md 순서 준수

## Path Conventions (Turborepo)

```
taste_spec_kit/
├── apps/
│   ├── api/          # NestJS 백엔드
│   └── web/          # Next.js 프론트엔드
├── packages/
│   ├── database/     # Drizzle ORM 스키마 (@repo/database)
│   ├── types/        # 공유 타입 (@repo/types)
│   ├── validators/   # Zod 스키마 (@repo/validators)
│   ├── ui/           # 공유 UI 컴포넌트 (@repo/ui)
│   └── config/       # 공유 설정 (@repo/config)
└── turbo.json        # Turborepo 설정
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Turborepo monorepo 초기화 및 기본 프로젝트 구조 생성

- [X] T001 Create Turborepo monorepo structure with apps/ and packages/ directories
- [X] T002 Initialize root package.json with workspaces configuration per turborepo-config.md
- [X] T003 Create turbo.json configuration file with pipeline definitions per turborepo-config.md
- [X] T004 [P] Setup @repo/config package with shared TypeScript configurations (base.json, next.json, nest.json)
- [X] T005 [P] Setup @repo/config package with shared ESLint configurations
- [X] T006 [P] Create @repo/types package structure with package.json and tsconfig
- [X] T007 [P] Create @repo/validators package structure with package.json and tsconfig
- [X] T008 [P] Create @repo/database package structure with package.json and drizzle.config.ts
- [X] T009 [P] Create @repo/ui package structure with package.json and Tailwind config
- [X] T010 Initialize apps/api with NestJS framework (^11.0.0) and configure module structure
- [X] T011 Initialize apps/web with Next.js (^15.1.0) and App Router structure
- [X] T012 Setup Docker Compose with PostgreSQL 16.x, Redis 7.x, and Mailhog services
- [X] T013 Create .env.example with all required environment variables per quickstart.md
- [X] T014 [P] Configure bun workspaces to link all packages and apps
- [X] T015 Run `bun install` to verify all workspace dependencies resolve correctly

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & ORM Setup

- [X] T016 Define User schema in packages/database/src/schema/user.schema.ts using Drizzle ORM per data-model.md
- [X] T017 [P] Define EmailVerificationToken schema in packages/database/src/schema/token.schema.ts
- [X] T018 [P] Define PasswordResetToken schema in packages/database/src/schema/token.schema.ts
- [X] T019 [P] Define AuthLog schema in packages/database/src/schema/auth-log.schema.ts
- [X] T020 Create schema barrel export in packages/database/src/schema/index.ts
- [X] T021 Setup Drizzle client in packages/database/src/client.ts with connection pooling
- [X] T022 Create @repo/database public API in packages/database/src/index.ts
- [X] T023 Generate initial database migrations using `bun drizzle-kit generate:pg`
- [X] T024 Apply migrations to local PostgreSQL using `bun drizzle-kit push:pg`

### Shared Type Definitions

- [X] T025 [P] Define User types in packages/types/src/user.types.ts (UserDTO, UpdateUserDTO, etc.)
- [X] T026 [P] Define Auth types in packages/types/src/auth.types.ts (LoginDTO, SignupDTO, SessionDTO, etc.)
- [X] T027 [P] Define API response types in packages/types/src/api.types.ts (SuccessResponse, ErrorResponse, etc.)
- [X] T028 Create types barrel export in packages/types/src/index.ts

### Validation Schemas

- [X] T029 [P] Implement auth validation schemas in packages/validators/src/auth.schemas.ts (signupSchema, loginSchema, resetPasswordSchema) using Zod
- [X] T030 [P] Implement user validation schemas in packages/validators/src/user.schemas.ts (updateProfileSchema, changePasswordSchema) using Zod
- [X] T031 [P] Implement common validation schemas in packages/validators/src/common.schemas.ts (emailSchema, passwordSchema) using Zod
- [X] T032 Create validators barrel export in packages/validators/src/index.ts

### Backend Core Infrastructure

- [X] T033 Setup better-auth configuration in apps/api/src/auth/better-auth.config.ts (Argon2id hashing, Redis session store)
- [X] T034 Create Auth Module in apps/api/src/auth/auth.module.ts with NestJS providers
- [X] T035 Create User Module in apps/api/src/user/user.module.ts with NestJS providers
- [X] T036 Create Email Module in apps/api/src/email/email.module.ts with NestJS providers
- [X] T037 Setup Redis connection in apps/api/src/common/redis.service.ts using ioredis
- [X] T038 Configure NestJS Throttler with Redis storage in apps/api/src/app.module.ts per research.md rate limiting strategy
- [X] T039 Setup BullMQ email queue in apps/api/src/email/queue/email.queue.ts per research.md
- [X] T040 Create email processor in apps/api/src/email/processors/email.processor.ts for queue handling
- [X] T041 Setup global exception filter in apps/api/src/common/filters/http-exception.filter.ts for consistent error responses
- [X] T042 Setup request logger interceptor in apps/api/src/common/interceptors/logging.interceptor.ts
- [X] T043 Create AuthLog service in apps/api/src/auth/auth-log.service.ts for audit logging
- [X] T044 Create secure token generator utility in apps/api/src/common/utils/token-generator.ts using crypto.randomBytes per research.md

### Frontend Core Infrastructure

- [X] T045 Setup better-auth client in apps/web/src/lib/auth.ts for session management
- [X] T046 Create API client utility in apps/web/src/lib/api-client.ts with fetch wrapper and error handling
- [X] T047 Create auth context provider in apps/web/src/providers/auth-provider.tsx using React Context
- [X] T048 Create useAuth hook in apps/web/src/hooks/useAuth.ts for auth state management
- [X] T049 [P] Setup shared UI components from @repo/ui (Button, Input, Form components) per contracts/turborepo-config.md
- [X] T050 Create app layout in apps/web/src/app/layout.tsx with auth provider and global styles

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 이메일 회원가입 (Priority: P1) 🎯 MVP

**Goal**: 신규 사용자가 이메일/비밀번호로 계정을 생성하고 이메일 인증을 통해 활성화

**Independent Test**: 회원가입 폼에서 이메일과 비밀번호 입력 → 데이터베이스에 사용자 생성 → 이메일 인증 링크 발송 → 링크 클릭 → 계정 활성화

### Backend Implementation (US1)

- [ ] T051 [P] [US1] Create SignupDTO in apps/api/src/auth/dto/signup.dto.ts importing @repo/validators/auth
- [ ] T052 [P] [US1] Create VerifyEmailDTO in apps/api/src/auth/dto/verify-email.dto.ts
- [ ] T053 [P] [US1] Create ResendVerificationDTO in apps/api/src/auth/dto/resend-verification.dto.ts
- [ ] T054 [US1] Implement AuthService.signup() method in apps/api/src/auth/auth.service.ts (create user, hash password with Argon2id, generate verification token)
- [ ] T055 [US1] Implement AuthService.verifyEmail() method in apps/api/src/auth/auth.service.ts (validate token, activate account)
- [ ] T056 [US1] Implement AuthService.resendVerification() method in apps/api/src/auth/auth.service.ts
- [ ] T057 [P] [US1] Create EmailService.sendVerificationEmail() method in apps/api/src/email/email.service.ts using nodemailer
- [ ] T058 [P] [US1] Create email verification HTML template in apps/api/src/email/templates/verification-email.html
- [ ] T059 [US1] Implement POST /api/v1/auth/signup endpoint in apps/api/src/auth/auth.controller.ts per contracts/auth-api.md
- [ ] T060 [US1] Implement GET /api/v1/auth/verify-email endpoint in apps/api/src/auth/auth.controller.ts per contracts/auth-api.md
- [ ] T061 [US1] Implement POST /api/v1/auth/resend-verification endpoint in apps/api/src/auth/auth.controller.ts per contracts/auth-api.md
- [ ] T062 [US1] Add AuthLog entries for SIGNUP and EMAIL_VERIFIED events in AuthService

### Frontend Implementation (US1)

- [ ] T063 [P] [US1] Create SignupForm component in apps/web/src/components/auth/SignupForm.tsx using react-hook-form and @repo/validators
- [ ] T064 [P] [US1] Create email verification page in apps/web/src/app/(auth)/verify-email/page.tsx
- [ ] T065 [P] [US1] Create signup page in apps/web/src/app/(auth)/signup/page.tsx with SignupForm
- [ ] T066 [US1] Implement signup API call in SignupForm using api-client
- [ ] T067 [US1] Add real-time validation feedback to SignupForm (email format, password strength)
- [ ] T068 [US1] Add success/error toast notifications for signup flow
- [ ] T069 [US1] Implement email verification token parsing and API call in verify-email page
- [ ] T070 [US1] Add loading states and error handling to all US1 forms

**Checkpoint**: User Story 1 complete - Users can sign up and verify email independently

---

## Phase 4: User Story 2 - 이메일/비밀번호 로그인 (Priority: P1) 🎯 MVP

**Goal**: 등록된 사용자가 이메일/비밀번호로 로그인하고 세션을 유지

**Independent Test**: 로그인 페이지에서 이메일/비밀번호 입력 → 인증 성공 → 대시보드 접근 → 로그아웃 → 다시 로그인 페이지로 리다이렉트

### Backend Implementation (US2)

- [ ] T071 [P] [US2] Create LoginDTO in apps/api/src/auth/dto/login.dto.ts importing @repo/validators/auth
- [ ] T072 [P] [US2] Create session guard in apps/api/src/auth/guards/session.guard.ts using better-auth session validation
- [ ] T073 [US2] Implement AuthService.login() method in apps/api/src/auth/auth.service.ts (validate credentials, check email_verified, create session in Redis)
- [ ] T074 [US2] Implement AuthService.logout() method in apps/api/src/auth/auth.service.ts (invalidate session)
- [ ] T075 [US2] Implement AuthService.getCurrentUser() method in apps/api/src/auth/auth.service.ts (get user from session)
- [ ] T076 [US2] Implement POST /api/v1/auth/login endpoint in apps/api/src/auth/auth.controller.ts per contracts/auth-api.md with rate limiting (5 attempts/15min)
- [ ] T077 [US2] Implement POST /api/v1/auth/logout endpoint in apps/api/src/auth/auth.controller.ts per contracts/auth-api.md
- [ ] T078 [US2] Implement GET /api/v1/auth/me endpoint in apps/api/src/auth/auth.controller.ts per contracts/auth-api.md
- [ ] T079 [US2] Add AuthLog entries for LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT events in AuthService
- [ ] T080 [US2] Implement account lockout logic after 5 failed login attempts in AuthService

### Frontend Implementation (US2)

- [ ] T081 [P] [US2] Create LoginForm component in apps/web/src/components/auth/LoginForm.tsx using react-hook-form and @repo/validators
- [ ] T082 [P] [US2] Create login page in apps/web/src/app/(auth)/login/page.tsx with LoginForm
- [ ] T083 [P] [US2] Create protected dashboard page in apps/web/src/app/(protected)/dashboard/page.tsx
- [ ] T084 [P] [US2] Create auth middleware in apps/web/src/middleware.ts to protect routes and redirect unauthenticated users
- [ ] T085 [US2] Implement login API call in LoginForm with session cookie handling
- [ ] T086 [US2] Implement logout functionality in useAuth hook and header component
- [ ] T087 [US2] Update auth context to fetch current user on mount using GET /auth/me
- [ ] T088 [US2] Add "Remember Me" functionality (extend session TTL) to LoginForm
- [ ] T089 [US2] Display user name in header/navigation for logged-in users

**Checkpoint**: User Stories 1 AND 2 complete - Full signup + login flow working independently

---

## Phase 5: User Story 3 - 비밀번호 재설정 (Priority: P2)

**Goal**: 사용자가 비밀번호를 잊었을 때 이메일을 통해 재설정

**Independent Test**: "비밀번호 찾기" → 이메일 입력 → 재설정 링크 수신 → 새 비밀번호 설정 → 새 비밀번호로 로그인 성공

### Backend Implementation (US3)

- [ ] T090 [P] [US3] Create ForgotPasswordDTO in apps/api/src/auth/dto/forgot-password.dto.ts
- [ ] T091 [P] [US3] Create ResetPasswordDTO in apps/api/src/auth/dto/reset-password.dto.ts importing @repo/validators
- [ ] T092 [US3] Implement AuthService.requestPasswordReset() method in apps/api/src/auth/auth.service.ts (generate reset token, queue email)
- [ ] T093 [US3] Implement AuthService.resetPassword() method in apps/api/src/auth/auth.service.ts (validate token, update password hash)
- [ ] T094 [P] [US3] Create EmailService.sendPasswordResetEmail() method in apps/api/src/email/email.service.ts
- [ ] T095 [P] [US3] Create password reset HTML template in apps/api/src/email/templates/password-reset-email.html
- [ ] T096 [US3] Implement POST /api/v1/auth/forgot-password endpoint in apps/api/src/auth/auth.controller.ts per contracts/auth-api.md with rate limiting (3 attempts/1hour)
- [ ] T097 [US3] Implement POST /api/v1/auth/reset-password endpoint in apps/api/src/auth/auth.controller.ts per contracts/auth-api.md
- [ ] T098 [US3] Add AuthLog entries for PASSWORD_RESET_REQUESTED and PASSWORD_RESET_COMPLETED events

### Frontend Implementation (US3)

- [ ] T099 [P] [US3] Create ForgotPasswordForm component in apps/web/src/components/auth/ForgotPasswordForm.tsx
- [ ] T100 [P] [US3] Create ResetPasswordForm component in apps/web/src/components/auth/ResetPasswordForm.tsx with password strength indicator
- [ ] T101 [P] [US3] Create forgot-password page in apps/web/src/app/(auth)/forgot-password/page.tsx
- [ ] T102 [P] [US3] Create reset-password page in apps/web/src/app/(auth)/reset-password/page.tsx
- [ ] T103 [US3] Implement forgot password API call in ForgotPasswordForm
- [ ] T104 [US3] Implement reset password API call in ResetPasswordForm with token parsing from URL
- [ ] T105 [US3] Add "Forgot Password?" link to login page
- [ ] T106 [US3] Add password strength meter to ResetPasswordForm using zxcvbn or similar

**Checkpoint**: User Stories 1, 2, AND 3 complete - Full auth flow with password recovery

---

## Phase 6: User Story 4 - 프로필 조회 및 수정 (Priority: P2)

**Goal**: 로그인한 사용자가 자신의 프로필 정보를 조회하고 수정

**Independent Test**: 로그인 → '내 프로필' 페이지 → 현재 정보 확인 → 이름 수정 → 저장 → 변경사항 반영 확인

### Backend Implementation (US4)

- [ ] T107 [P] [US4] Create UpdateProfileDTO in apps/api/src/user/dto/update-profile.dto.ts importing @repo/validators
- [ ] T108 [P] [US4] Create ChangePasswordDTO in apps/api/src/user/dto/change-password.dto.ts importing @repo/validators
- [ ] T109 [US4] Create UserService with getProfile() method in apps/api/src/user/user.service.ts
- [ ] T110 [US4] Implement UserService.updateProfile() method in apps/api/src/user/user.service.ts (handle email change with re-verification)
- [ ] T111 [US4] Implement UserService.changePassword() method in apps/api/src/user/user.service.ts (verify current password, hash new password)
- [ ] T112 [US4] Implement GET /api/v1/users/profile endpoint in apps/api/src/user/user.controller.ts per contracts/user-api.md (protected)
- [ ] T113 [US4] Implement PATCH /api/v1/users/profile endpoint in apps/api/src/user/user.controller.ts per contracts/user-api.md (protected)
- [ ] T114 [US4] Implement POST /api/v1/users/change-password endpoint in apps/api/src/user/user.controller.ts per contracts/user-api.md (protected)
- [ ] T115 [US4] Add AuthLog entry for PASSWORD_CHANGED event in UserService
- [ ] T116 [US4] Handle email change re-verification flow (send new verification email to new address)

### Frontend Implementation (US4)

- [ ] T117 [P] [US4] Create ProfileForm component in apps/web/src/components/auth/ProfileForm.tsx using react-hook-form
- [ ] T118 [P] [US4] Create ChangePasswordForm component in apps/web/src/components/auth/ChangePasswordForm.tsx
- [ ] T119 [P] [US4] Create profile page in apps/web/src/app/(protected)/profile/page.tsx
- [ ] T120 [US4] Implement profile fetch API call in profile page using GET /users/profile
- [ ] T121 [US4] Implement profile update API call in ProfileForm using PATCH /users/profile
- [ ] T122 [US4] Implement password change API call in ChangePasswordForm using POST /users/change-password
- [ ] T123 [US4] Add confirmation dialog for email change with re-verification notice
- [ ] T124 [US4] Add success feedback and optimistic UI updates to profile forms

**Checkpoint**: User Stories 1-4 complete - Full user management with profile editing

---

## Phase 7: User Story 5 - 계정 비활성화 (Priority: P3)

**Goal**: 사용자가 자신의 계정을 비활성화하거나 영구 삭제 요청

**Independent Test**: 로그인 → '계정 설정' → '계정 비활성화' → 확인 → 로그아웃 → 로그인 시도 → "비활성화된 계정" 에러

### Backend Implementation (US5)

- [ ] T125 [P] [US5] Create DeactivateAccountDTO in apps/api/src/user/dto/deactivate-account.dto.ts
- [ ] T126 [P] [US5] Create RequestDeletionDTO in apps/api/src/user/dto/request-deletion.dto.ts
- [ ] T127 [US5] Implement UserService.deactivateAccount() method in apps/api/src/user/user.service.ts (set is_active=false)
- [ ] T128 [US5] Implement UserService.requestDeletion() method in apps/api/src/user/user.service.ts (set deleted_at, schedule cleanup)
- [ ] T129 [US5] Implement UserService.cancelDeletion() method in apps/api/src/user/user.service.ts (clear deleted_at)
- [ ] T130 [US5] Implement POST /api/v1/users/deactivate endpoint in apps/api/src/user/user.controller.ts per contracts/user-api.md (protected)
- [ ] T131 [US5] Implement POST /api/v1/users/request-deletion endpoint in apps/api/src/user/user.controller.ts per contracts/user-api.md (protected)
- [ ] T132 [US5] Implement POST /api/v1/users/cancel-deletion endpoint in apps/api/src/user/user.controller.ts per contracts/user-api.md (protected)
- [ ] T133 [US5] Add AuthLog entries for ACCOUNT_DEACTIVATED and ACCOUNT_DELETED events
- [ ] T134 [US5] Create cron job script for permanent deletion after 30 days in apps/api/src/user/jobs/cleanup-deleted-users.job.ts
- [ ] T135 [US5] Update login logic to check is_active flag and block deactivated accounts

### Frontend Implementation (US5)

- [ ] T136 [P] [US5] Create DeactivateAccountForm component in apps/web/src/components/auth/DeactivateAccountForm.tsx with password confirmation
- [ ] T137 [P] [US5] Create account settings page in apps/web/src/app/(protected)/settings/page.tsx
- [ ] T138 [US5] Implement deactivate account API call in DeactivateAccountForm using POST /users/deactivate
- [ ] T139 [US5] Implement request deletion API call using POST /users/request-deletion
- [ ] T140 [US5] Implement cancel deletion API call using POST /users/cancel-deletion
- [ ] T141 [US5] Add multi-step confirmation dialog with warning messages for account deletion
- [ ] T142 [US5] Add "Are you sure?" modal with password re-entry for deactivation
- [ ] T143 [US5] Show deletion countdown timer if account is scheduled for deletion

**Checkpoint**: All user stories (1-5) complete - Full feature set implemented

---

## Phase 8: Activity Logging & Monitoring (Cross-Cutting)

**Goal**: Provide users visibility into their authentication activity for security

**Independent Test**: 로그인 → '활동 로그' 페이지 → 최근 로그인 기록 확인 → IP 주소 및 기기 정보 표시

- [ ] T144 [P] Implement GET /api/v1/users/activity-log endpoint in apps/api/src/user/user.controller.ts per contracts/user-api.md (protected, paginated)
- [ ] T145 [P] Implement UserService.getActivityLog() method in apps/api/src/user/user.service.ts with pagination
- [ ] T146 [P] Create activity log page in apps/web/src/app/(protected)/activity/page.tsx
- [ ] T147 Implement activity log fetch with pagination in activity page
- [ ] T148 Add filtering by event type (LOGIN_SUCCESS, PASSWORD_CHANGED, etc.) to activity log page
- [ ] T149 Display IP address, user agent, and timestamp in activity log table
- [ ] T150 Add "suspicious activity" detection alerts (e.g., login from new location)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

### Email Queue & Reliability

- [ ] T151 [P] Configure BullMQ retry strategy (3 attempts, exponential backoff) in email queue per research.md
- [ ] T152 [P] Add email queue dashboard using Bull Board in apps/api for monitoring
- [ ] T153 [P] Implement email delivery status tracking in EmailService
- [ ] T154 Setup email rate limiting to respect free tier limits (e.g., SendGrid 100/day)

### Security Hardening

- [ ] T155 [P] Enable CORS with strict origin whitelist in apps/api main.ts
- [ ] T156 [P] Add security headers (Helmet) to NestJS app (CSP, X-Frame-Options, etc.)
- [ ] T157 [P] Implement CSRF protection for state-changing endpoints in NestJS
- [ ] T158 [P] Add rate limit headers (X-RateLimit-*) to all API responses per contracts/auth-api.md
- [ ] T159 Setup HTTPS enforcement in production environment
- [ ] T160 Implement token blacklisting for immediate logout after password change

### Performance Optimization

- [ ] T161 [P] Add database connection pooling configuration (max 20 connections) per data-model.md
- [ ] T162 [P] Create database indexes per data-model.md (email, created_at, expires_at, token fields)
- [ ] T163 [P] Implement Redis session caching with proper TTL (7 days) per research.md
- [ ] T164 [P] Add pagination to all list endpoints (default: 20 items, max: 100)
- [ ] T165 Optimize email template rendering (cache compiled templates)
- [ ] T166 Add response compression (gzip) to NestJS app

### Error Handling & Logging

- [ ] T167 [P] Implement structured logging with correlation IDs for request tracing
- [ ] T168 [P] Add error monitoring integration (e.g., Sentry) for production
- [ ] T169 [P] Create custom error classes for domain-specific errors (EmailNotVerifiedError, AccountLockoutError)
- [ ] T170 Add request/response logging for all authentication events
- [ ] T171 Implement log rotation and retention policy (1 year for AuthLog per data-model.md)

### Documentation & Developer Experience

- [ ] T172 [P] Add API documentation using Swagger/OpenAPI in apps/api
- [ ] T173 [P] Create README.md in apps/api with setup instructions
- [ ] T174 [P] Create README.md in apps/web with development workflow
- [ ] T175 [P] Document environment variables in .env.example with descriptions
- [ ] T176 Add Storybook stories for all shared UI components in @repo/ui
- [ ] T177 Update quickstart.md with any implementation-specific changes

### Testing Infrastructure (Optional - if needed)

- [ ] T178 [P] Setup Playwright E2E test configuration in apps/web/test/e2e/
- [ ] T179 [P] Setup Vitest unit test configuration in all packages
- [ ] T180 [P] Create test database seeding scripts for local development
- [ ] T181 Add test data factories for User, Token entities using Drizzle

### Deployment Preparation

- [ ] T182 [P] Create Dockerfile for apps/api with multi-stage build
- [ ] T183 [P] Create Dockerfile for apps/web with Next.js optimization
- [ ] T184 [P] Update docker-compose.yml for production-like environment
- [ ] T185 [P] Create database migration strategy for production (zero-downtime)
- [ ] T186 Add health check endpoints (/health, /ready) in apps/api
- [ ] T187 Create CI/CD workflow (GitHub Actions) using Turborepo caching per turborepo-config.md

### Final Validation

- [ ] T188 Run full quickstart.md validation from scratch (30-minute setup test)
- [ ] T189 Verify all Constitution Check items from plan.md are satisfied
- [ ] T190 Run `bun turbo run build` to verify all packages and apps build successfully
- [ ] T191 Run `bun turbo run type-check` to verify TypeScript strict mode compliance
- [ ] T192 Run `bun turbo run lint` to verify code style compliance
- [ ] T193 Verify all Success Criteria from spec.md are measurable and documented
- [ ] T194 Create feature demo video or walkthrough document
- [ ] T195 Final code review against constitution principles (SSOT, Type-Safety, Boundaries, etc.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 completion - No dependencies on other user stories
- **Phase 4 (US2)**: Depends on Phase 2 completion - No dependencies on US1 (independent)
- **Phase 5 (US3)**: Depends on Phase 2 completion - Integrates with US2 (login) but independently testable
- **Phase 6 (US4)**: Depends on Phase 2 completion - Requires US2 (authentication) for protected routes
- **Phase 7 (US5)**: Depends on Phase 2 completion - Requires US2 (authentication) for protected routes
- **Phase 8 (Activity Logging)**: Depends on Phase 2 completion - Cross-cutting feature
- **Phase 9 (Polish)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Signup)**: Can start after Foundational (Phase 2) - Fully independent
- **User Story 2 (P1 - Login)**: Can start after Foundational (Phase 2) - Fully independent
- **User Story 3 (P2 - Password Reset)**: Requires US2 for "forgot password" link visibility, but logic is independent
- **User Story 4 (P2 - Profile)**: Requires US2 for authentication context, integrates with existing user data
- **User Story 5 (P3 - Deactivation)**: Requires US2 for authentication, affects login logic

### MVP Scope 🎯

**Recommended MVP**: User Stories 1 + 2 (Phases 1-4)
- Complete signup and login flow
- Email verification
- Session management
- Fully functional authentication system
- **Estimated**: ~50 tasks (T001-T089)

**Extended MVP**: Add User Story 3 (Phase 5)
- Password recovery
- More complete user experience
- **Estimated**: +17 tasks (T090-T106)

### Parallel Opportunities by Phase

**Phase 1 (Setup)**: Tasks T004-T009, T014 can run in parallel (different packages)

**Phase 2 (Foundational)**:
- Database schemas (T017-T019) can run in parallel after T016
- Type definitions (T025-T027) can run in parallel
- Validators (T029-T031) can run in parallel
- Backend infrastructure (T037-T044) can run in parallel after modules are created
- Frontend infrastructure (T045-T049) can run in parallel

**Phase 3 (US1)**:
- DTOs (T051-T053) can run in parallel
- Email template (T058) can be created in parallel with backend logic
- Frontend components (T063-T065) can run in parallel after shared infrastructure

**Phase 4 (US2)**:
- DTOs and guards (T071-T072) can run in parallel
- Frontend components (T081-T084) can run in parallel

**Phase 5 (US3)**:
- DTOs (T090-T091) can run in parallel
- Email template (T095) in parallel with backend logic
- Frontend components (T099-T102) can run in parallel

**Phase 6 (US4)**:
- DTOs (T107-T108) can run in parallel
- Frontend components (T117-T119) can run in parallel

**Phase 7 (US5)**:
- DTOs (T125-T126) can run in parallel
- Frontend components (T136-T137) can run in parallel

**Phase 8 (Activity Logging)**: Tasks T144-T145 backend can run in parallel with T146 frontend

**Phase 9 (Polish)**: Most tasks marked [P] can run in parallel as they affect different areas

### Execution Strategy

**For Solo Developer**:
1. Complete Phase 1 (Setup): ~1-2 days
2. Complete Phase 2 (Foundational): ~3-4 days
3. Complete Phase 3 (US1): ~2-3 days
4. Complete Phase 4 (US2): ~2-3 days
5. **STOP HERE FOR MVP** - Have working auth system
6. Optional: Add Phase 5-7 incrementally

**For Team (2-3 developers)**:
1. All: Complete Phase 1-2 together (foundational work)
2. After Phase 2:
   - Dev A: Phase 3 (US1)
   - Dev B: Phase 4 (US2)
   - Both can work in parallel since user stories are independent
3. Continue assigning user stories in priority order

**Turborepo Advantages**:
- Package changes auto-rebuild dependent apps
- Parallel task execution with `bun turbo run dev`
- Cached builds speed up development
- Independent package testing

---

## Task Summary

**Total Tasks**: 195 tasks
- Phase 1 (Setup): 15 tasks
- Phase 2 (Foundational): 35 tasks (BLOCKING)
- Phase 3 (US1 - Signup): 20 tasks
- Phase 4 (US2 - Login): 19 tasks
- Phase 5 (US3 - Password Reset): 17 tasks
- Phase 6 (US4 - Profile): 18 tasks
- Phase 7 (US5 - Deactivation): 19 tasks
- Phase 8 (Activity Logging): 7 tasks
- Phase 9 (Polish): 45 tasks

**MVP Tasks (US1 + US2)**: 89 tasks
**Extended MVP (+US3)**: 106 tasks
**Parallel Tasks**: ~40% of tasks can run in parallel within each phase

**Constitution Compliance**: ✅ All tasks align with 8 core principles
- SSOT: @repo/database, @repo/types as single sources
- Type-Safety: TypeScript strict mode, Drizzle ORM, Zod throughout
- Boundaries: Clear package separation (apps vs packages)
- Local-First: Docker Compose, Mailhog, local development focus
- Cost-Aware: Redis caching, email queues, session optimization
- Overrides-Only: @repo/config base configs, minimal app overrides
- Pinned-Stack: All dependencies versioned in package.json files
- Spec-Before-Code: Tasks derived from spec.md user stories

**Implementation Ready**: Each task has specific file paths and clear acceptance criteria

