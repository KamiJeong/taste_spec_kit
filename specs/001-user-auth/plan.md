# Implementation Plan: User Authentication System

**Branch**: `001-user-auth` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-user-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a foundational user authentication system using better-auth library with Next.js 14+ App Router. The system supports user registration (signup), login/logout with Redis-backed session management, and basic profile management. Users can register with email/password, authenticate to obtain a 30-day session (renewed on activity, stored in Redis), and update their display name. UI components built with shadcn/ui for accessibility and consistency. This is the foundation feature with no dependencies, required by both 001-group-management and 001-group-board-system.

## Technical Context

**Language/Version**: TypeScript 5.0+ (Next.js 14+ App Router for full-stack)  
**Primary Dependencies**: 
- **Framework**: Next.js 14+, React 18.2+, TypeScript 5.0+
- **UI Components**: shadcn/ui, Storybook
- **Forms & Validation**: react-hook-form 7+, Zod 3.22+
- **Authentication**: better-auth (type-safe auth library)
- **Database**: PostgreSQL 15+ (primary), Redis (cache/session)
- **ORM**: Prisma 5.0+ (type-safe database access)

**Storage**: PostgreSQL 15+ (users and sessions with ACID compliance), Redis (session cache, rate limiting)  
**Testing**: Playwright 1.40+ (E2E), Vitest 1.0+ with React Testing Library (unit), Storybook (component testing)  
**Target Platform**: Node.js 20+ on Vercel (preferred) or Docker containers (AWS/GCP/Azure)  
**Project Type**: Full-stack Next.js application (App Router with Server Actions)  
**Performance Goals**: 1000 concurrent users, <200ms response time for auth operations (from SC-005)  
**Constraints**: <200ms p95 for all auth operations, secure password storage (bcrypt work factor 12), 30-day session management with activity renewal  
**Scale/Scope**: Support for 1000 concurrent users initially, 4 main user flows (signup/login/logout/profile management)

**Session Strategy**: Redis-backed sessions with better-auth integration for secure server-side session management

**Security**: Defense-in-depth following OWASP guidelines - bcrypt password hashing via better-auth, secure session cookies, rate limiting with Redis (5 attempts → 15min lockout), TLS 1.3, CSRF protection via better-auth, input validation with Zod

*Technical decisions aligned with project standard tech stack (see /specs/README.md)*

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: The constitution.md file is currently a template. This project does not yet have established architectural principles. The following checks are based on general best practices:

### Pre-Phase 0 Gates
- [x] **Simplicity**: Start with the simplest possible architecture that meets requirements
- [x] **Test-First**: Commitment to TDD workflow (tests → approval → implementation)
- [x] **Clear Boundaries**: Authentication should be a standalone, well-defined module
- [x] **No Premature Optimization**: Focus on correctness first, performance second

### Post-Phase 1 Gates (Re-check after design)
- [ ] **Architecture Simplicity**: Chosen architecture is the simplest that works
- [ ] **Testability**: All components are independently testable
- [ ] **Documentation**: Data models and contracts are complete and clear

## Project Structure

### Documentation (this feature)

```text
specs/001-user-auth/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Auth route group (shared layout)
│   │   ├── login/          # Login page
│   │   │   └── page.tsx
│   │   ├── signup/         # Signup page
│   │   │   └── page.tsx
│   │   └── layout.tsx      # Auth pages layout
│   ├── profile/            # Profile page (protected)
│   │   └── page.tsx
│   ├── api/                # API routes for better-auth
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts  # better-auth handler
│   └── layout.tsx          # Root layout
├── lib/                    # Shared utilities and services
│   ├── db/                 # Database connection
│   │   └── client.ts       # Prisma client singleton
│   ├── auth/               # Authentication setup
│   │   ├── config.ts       # better-auth configuration
│   │   ├── client.ts       # Auth client (frontend)
│   │   └── server.ts       # Auth helpers (Server Components/Actions)
│   ├── redis/              # Redis connection
│   │   └── client.ts       # Redis client for sessions
│   └── validations/        # Zod schemas
│       └── auth.ts         # Auth input validation schemas
├── components/             # React components
│   ├── auth/              
│   │   ├── LoginForm.tsx   # Login form with react-hook-form
│   │   ├── SignupForm.tsx  # Signup form with react-hook-form
│   │   └── ProfileForm.tsx # Profile editing form
│   └── ui/                # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── form.tsx
│       └── ...            # Other shadcn/ui components
├── middleware.ts           # Next.js middleware for auth protection
└── hooks/                  # Custom React hooks
    └── use-auth.ts         # Auth state hook

drizzle/
├── migrations/            # Database migrations (auto-generated)
└── meta/                  # Migration metadata

tests/
├── e2e/                   # Playwright E2E tests
│   ├── signup.spec.ts
│   ├── login.spec.ts
│   └── profile.spec.ts
└── unit/                  # Vitest unit tests
    ├── components/
    ├── lib/
    └── validations/

.storybook/                # Storybook configuration
stories/                   # Component stories
    └── auth/
        ├── LoginForm.stories.tsx
        ├── SignupForm.stories.tsx
        └── ProfileForm.stories.tsx
```

**Structure Decision**: Selected Next.js App Router full-stack architecture with better-auth because it enables:
- **Type-safe authentication**: better-auth provides end-to-end TypeScript safety
- **Built-in session management**: Redis-backed sessions with automatic refresh
- **Unified codebase**: Single TypeScript codebase for frontend and backend
- **Component-first UI**: shadcn/ui provides accessible, customizable components
- **Form validation**: react-hook-form + Zod for type-safe form handling
- **Simplified deployment**: Single application deployable to Vercel or containers

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
