# Research: User Authentication System

**Feature**: 001-user-auth  
**Date**: 2026-02-05  
**Phase**: Phase 0 - Technical Research

## Overview

This document consolidates technical research for implementing the user authentication system. Each section addresses a "NEEDS CLARIFICATION" item from the Technical Context, evaluates alternatives, and documents the final decision with rationale.

---

## 1. Language and Version Selection

### Decision
**Python 3.11+** for backend  
**TypeScript 5.0+** with React 18 for frontend

### Rationale

**Backend - Python 3.11+:**
- **Maturity**: Extensive ecosystem for web authentication (passlib, PyJWT, python-jose)
- **Security Libraries**: Battle-tested password hashing (bcrypt, argon2), JWT management
- **Rapid Development**: Clear syntax, extensive documentation reduces time-to-market
- **Performance**: Adequate for 1000 concurrent users target; async support via asyncio
- **Future-Proof**: Python 3.11+ includes performance improvements (faster CPython)

**Frontend - TypeScript + React:**
- **Type Safety**: TypeScript prevents common runtime errors in auth flows (critical for security)
- **Ecosystem**: Rich component libraries, form validation (React Hook Form, Formik)
- **Developer Experience**: Strong IDE support, catch errors during development
- **Industry Standard**: Widely adopted, easy to find developers, extensive resources

### Alternatives Considered

**Backend Alternatives:**
1. **Node.js/TypeScript**: 
   - Pros: Single language across stack, excellent async performance
   - Rejected: Python's security libraries are more mature; auth is CPU-bound (hashing) where Python excels with C extensions

2. **Go**:
   - Pros: Superior performance, built-in concurrency
   - Rejected: Smaller ecosystem for auth, longer development time for web features

3. **Rust**:
   - Pros: Maximum security and performance
   - Rejected: Steeper learning curve, slower development, overkill for 1000 user target

**Frontend Alternatives:**
1. **Vue.js**:
   - Pros: Simpler learning curve, good TypeScript support
   - Rejected: React has larger ecosystem, more resources for auth UI patterns

2. **Svelte**:
   - Pros: Excellent performance, less boilerplate
   - Rejected: Smaller ecosystem, fewer auth-specific component libraries

---

## 2. Primary Dependencies

### Decision

**Backend:**
- **FastAPI 0.104+**: Web framework
- **SQLAlchemy 2.0+**: ORM for database access
- **Passlib 1.7+ with bcrypt**: Password hashing
- **PyJWT 2.8+**: JWT token management for sessions
- **Pydantic 2.0+**: Data validation (included with FastAPI)
- **Alembic**: Database migrations

**Frontend:**
- **React 18.2+**: UI framework
- **React Router 6+**: Client-side routing
- **React Hook Form 7+**: Form validation and management
- **Axios 1.6+**: HTTP client for API calls
- **Zod 3.22+**: Schema validation for forms

### Rationale

**FastAPI:**
- Async/await support for handling concurrent sessions
- Automatic OpenAPI documentation (critical for contract-first development)
- Built-in request validation via Pydantic
- Excellent performance (on par with Node.js)
- Security features: OAuth2, JWT, CORS middleware

**SQLAlchemy 2.0:**
- Mature ORM with comprehensive features
- Async support for FastAPI integration
- Type hints support for better IDE experience
- Migration support via Alembic

**Passlib + bcrypt:**
- Industry-standard password hashing
- Configurable work factors for future-proofing
- Protection against timing attacks
- Well-audited, widely used

**PyJWT:**
- Standard JWT implementation
- Supports multiple algorithms (HS256, RS256)
- Good performance for session token generation/validation

**React Hook Form:**
- Minimal re-renders (performance)
- Built-in validation
- TypeScript support
- Handles complex form state (signup, profile edit)

**Zod:**
- Runtime type validation
- TypeScript inference
- Composable schemas
- Reusable validation rules across frontend

### Alternatives Considered

**Web Framework:**
1. **Django + DRF**:
   - Pros: Built-in auth, admin panel, batteries included
   - Rejected: Heavier, slower than FastAPI, less async-friendly, more boilerplate

2. **Flask**:
   - Pros: Lightweight, flexible
   - Rejected: Less structure, manual async setup, no automatic API docs

**ORM:**
1. **Django ORM**:
   - Pros: Integrated with Django, simpler for basic queries
   - Rejected: Tied to Django (we chose FastAPI)

2. **Raw SQL**:
   - Pros: Maximum control and performance
   - Rejected: More verbose, manual migration management, SQL injection risks

**Password Hashing:**
1. **Argon2**:
   - Pros: Winner of password hashing competition, more resistant to GPU attacks
   - Rejected: Less widely deployed, bcrypt is sufficient for current threat model

**Frontend Form Management:**
1. **Formik**:
   - Pros: More features, larger community
   - Rejected: Heavier, more re-renders, React Hook Form is more performant

---

## 3. Storage Solution

### Decision
**PostgreSQL 15+** for primary data storage

### Rationale

- **ACID Compliance**: Critical for user authentication (prevent race conditions in session management)
- **JSON Support**: Native JSONB type useful for storing session metadata flexibly
- **Performance**: Excellent for 1000 concurrent users, proven at much larger scales
- **Security**: Row-level security, SSL connections, mature permission system
- **Open Source**: No licensing costs, strong community
- **Mature Ecosystem**: Extensive Python support (psycopg3, asyncpg), monitoring tools
- **Future Growth**: Supports millions of users without re-architecture

**Storage Strategy:**
- Users table: id (UUID), email (unique), password_hash, display_name, created_at
- Sessions table: id (UUID), user_id (FK), token_hash, expires_at, last_activity_at, created_at
- Indexes on: email (users), user_id + expires_at (sessions)

### Alternatives Considered

1. **MySQL/MariaDB**:
   - Pros: Widely deployed, good performance
   - Rejected: PostgreSQL has better JSON support, stronger compliance guarantees

2. **SQLite**:
   - Pros: Zero configuration, embedded
   - Rejected: Not suitable for concurrent writes (authentication requires concurrent session updates)

3. **MongoDB**:
   - Pros: Flexible schema, easy horizontal scaling
   - Rejected: Eventual consistency not acceptable for auth; ACID guarantees more important than schema flexibility

4. **Redis (primary)**:
   - Pros: Extremely fast, excellent for sessions
   - Rejected: In-memory only increases costs; data loss risk unacceptable for user accounts. (Will use Redis for session *caching* later if needed)

---

## 4. Testing Framework

### Decision

**Backend:**
- **pytest 7.4+**: Primary test framework
- **pytest-asyncio**: Async test support
- **pytest-cov**: Code coverage reporting
- **httpx**: Async HTTP client for API testing
- **Factory Boy**: Test data factories

**Frontend:**
- **Vitest 1.0+**: Test runner (faster Jest alternative)
- **React Testing Library 14+**: Component testing
- **MSW (Mock Service Worker) 2.0+**: API mocking
- **Playwright 1.40+**: End-to-end testing

### Rationale

**pytest:**
- De facto standard for Python testing
- Clean syntax (assert statements)
- Extensive plugin ecosystem
- Excellent async support
- Fixtures for test data management
- Parallel test execution

**Vitest:**
- Vite-native (faster than Jest)
- Jest-compatible API (easy migration)
- ESM and TypeScript out-of-box
- Fast watch mode for TDD

**React Testing Library:**
- Tests user behavior, not implementation
- Encourages accessibility
- Discourages brittle tests
- Industry standard

**Playwright:**
- Cross-browser testing
- Auto-wait functionality (less flaky tests)
- Excellent debugging tools
- Good CI/CD integration

### Alternatives Considered

**Backend:**
1. **unittest**:
   - Pros: Built-in, no dependencies
   - Rejected: More verbose, less feature-rich than pytest

2. **nose2**:
   - Pros: Extends unittest
   - Rejected: Less actively maintained than pytest

**Frontend:**
1. **Jest**:
   - Pros: Most popular, largest ecosystem
   - Rejected: Slower than Vitest, especially for TypeScript

2. **Cypress**:
   - Pros: Excellent debugging, time-travel
   - Rejected: Slower than Playwright, less reliable for cross-browser

---

## 5. Target Platform and Deployment

### Decision
**Docker Containers on Linux (Ubuntu 22.04 LTS)** deployed to **cloud platform** (AWS/GCP/Azure agnostic)

### Rationale

**Docker Containers:**
- **Reproducibility**: Identical environments (dev, staging, prod)
- **Isolation**: Dependencies packaged with application
- **Scalability**: Easy horizontal scaling via container orchestration
- **CI/CD Integration**: Simple deployment pipelines
- **Development Experience**: Local environment matches production

**Linux (Ubuntu 22.04 LTS):**
- **Performance**: Native performance for Python and PostgreSQL
- **Cost**: Lower licensing costs than Windows Server
- **Stability**: LTS version supported until 2027
- **Ecosystem**: Best support for Docker, PostgreSQL, Python

**Cloud Platform (Multi-cloud ready):**
- **Managed Services**: Reduce operational overhead (managed PostgreSQL, load balancers)
- **Scalability**: Handle traffic spikes (1000 concurrent users baseline)
- **Reliability**: SLAs for uptime (99.9%+)
- **Security**: DDoS protection, WAF, SSL termination
- **Cost-Effective**: Pay-as-you-go for MVP stage

**Initial Architecture:**
```
┌─────────────┐
│   Frontend  │ (Static hosting: S3, CloudFront / Netlify / Vercel)
│   (React)   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│  Backend    │ (Docker container: ECS, Cloud Run, or App Service)
│  (FastAPI)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │ (Managed service: RDS, Cloud SQL, Azure Database)
└─────────────┘
```

### Alternatives Considered

1. **Serverless (AWS Lambda / Google Cloud Functions)**:
   - Pros: Auto-scaling, pay per request, zero ops
   - Rejected: Cold starts impact auth UX; session state management more complex; cost unpredictable with 1000 concurrent users

2. **Traditional VMs**:
   - Pros: Maximum control
   - Rejected: More operational overhead, slower deployments, harder to scale

3. **Platform-as-a-Service (Heroku)**:
   - Pros: Extremely simple deployment
   - Rejected: Higher cost at scale, less control, potential vendor lock-in

4. **Kubernetes**:
   - Pros: Industry standard for orchestration, maximum flexibility
   - Rejected: Overkill for single application MVP; complex to manage; Docker + managed platform sufficient

5. **On-Premise**:
   - Pros: Maximum data control
   - Rejected: Higher upfront costs, maintenance burden, scaling limitations

---

## 6. Session Management Strategy

### Decision
**JWT tokens stored in HTTP-only cookies** with **database-backed session validation**

### Rationale

**Hybrid Approach Benefits:**
- **Security**: HTTP-only cookies prevent XSS attacks
- **Flexibility**: Can invalidate sessions server-side (logout all devices)
- **Performance**: JWT reduces database queries for most requests
- **Compliance**: Can track session history (last_activity_at)
- **Requirements**: Meets 30-day expiration with activity renewal

**Implementation:**
1. Login creates JWT with session_id + user_id
2. JWT stored in HTTP-only, Secure, SameSite=Strict cookie
3. Session record in database tracks expiration and last activity
4. Middleware validates JWT and checks session in database
5. Activity updates last_activity_at and extends expires_at
6. Logout deletes session from database (JWT becomes invalid)

### Alternatives Considered

1. **Pure JWT (stateless)**:
   - Pros: No database queries, scales horizontally easily
   - Rejected: Cannot revoke sessions without additional infrastructure (blacklist); harder to track activity

2. **Server-side sessions only (session ID in cookie)**:
   - Pros: Complete server control, easy revocation
   - Rejected: Database query on every request hurts performance; doesn't meet <200ms p95 goal

3. **Redis sessions**:
   - Pros: Extremely fast
   - Rejected: Additional infrastructure cost; data loss risk (would need persistence); PostgreSQL sufficient for 1000 users

---

## 7. Security Best Practices

### Decision
Implement defense-in-depth security strategy following OWASP guidelines

### Key Security Measures

**Password Security:**
- Bcrypt with work factor 12 (adjustable)
- Minimum 8 characters, requires number + special character
- Password strength validation on client and server
- Constant-time comparison to prevent timing attacks

**Session Security:**
- HTTP-only cookies (prevent XSS)
- Secure flag (HTTPS only)
- SameSite=Strict (prevent CSRF)
- 30-day expiration with activity renewal
- Session invalidation on password change

**API Security:**
- HTTPS/TLS 1.3 only
- CORS restricted to frontend domain
- Rate limiting (prevent brute force): 5 failed login attempts → 15 minute lockout
- Input validation on all endpoints
- SQL injection prevention via ORM parameterized queries
- XSS prevention via output encoding

**Database Security:**
- Least-privilege database user
- SSL/TLS connections
- Password hashing (never store plaintext)
- Regular backups with encryption

**Monitoring:**
- Log failed login attempts (rate limiting trigger)
- Alert on unusual patterns (many signups from same IP)
- Audit trail for sensitive operations

### Rationale
Multi-layered approach ensures if one defense fails, others protect the system. Follows industry standards and addresses common vulnerabilities (OWASP Top 10).

---

## 8. Performance Optimization Strategy

### Decision
**Optimize for correctness first, performance second** with targeted optimizations for known bottlenecks

### Planned Optimizations

**Database:**
- Indexes on user.email (unique), session.user_id, session.expires_at
- Connection pooling (SQLAlchemy default: 5 min, 10 max)
- Prepared statements via ORM (SQL injection prevention + performance)

**API:**
- Async FastAPI handlers (handle 1000 concurrent requests)
- Gzip compression for responses
- Caching headers for static content

**Frontend:**
- Code splitting (React.lazy) for auth pages
- Form validation debouncing (reduce API calls)
- Optimistic UI updates (instant feedback)

**Monitoring:**
- APM (Application Performance Monitoring) from day 1
- Track p50, p95, p99 latency
- Database query profiling

### Performance Targets (from spec)
- SC-001: Signup + login < 3 minutes (user time)
- SC-004: Profile update < 1 second
- SC-005: Support 1000 concurrent users
- Constraints: <200ms p95 for all auth operations

### Why Not More Optimization?
- Avoid premature optimization (constitution principle)
- 1000 concurrent users well within single-server capability
- Can add Redis caching, load balancing, CDN later if needed
- Measure first, optimize second

---

## Summary of Technical Decisions

| Aspect | Decision | Key Reason |
|--------|----------|------------|
| Full-Stack Framework | Next.js 14+ (App Router) | Unified TypeScript codebase, Server Actions, built-in optimizations |
| Language | TypeScript 5.0+ | Type safety critical for auth flows, single language for entire stack |
| Authentication Library | better-auth | Type-safe, Next.js native, built-in session management, extensible |
| UI Components | shadcn/ui | Accessible, customizable, Tailwind-based, type-safe |
| Forms | react-hook-form + Zod | Performance, type-safe validation, great DX |
| Database | PostgreSQL 15+ | ACID compliance, proven scalability |
| ORM | Drizzle ORM | Lightweight, type-safe, zero overhead, excellent DX |
| Cache/Session | Redis | Fast session storage, rate limiting, scales horizontally |
| Component Testing | Storybook | Isolated development, visual testing, documentation |
| E2E Testing | Playwright | Reliable, fast, cross-browser support |
| Deployment | Vercel (preferred) | Next.js-optimized, edge network, easy deployment |

**Note**: Technical decisions align with project standard tech stack defined in `/specs/README.md`.

**Why Drizzle ORM?**
- **Lightweight**: Zero runtime overhead, minimal abstraction over SQL
- **Type Safety**: Full TypeScript support with automatic type inference from schema
- **Performance**: No query builder overhead, compiles to direct SQL
- **Developer Experience**: SQL-like syntax, easy for SQL developers
- **Migrations**: Simple migration system with Drizzle Kit
- **No Code Generation**: Unlike Prisma, works directly without generated client

**Why better-auth?**
- End-to-end TypeScript with automatic type inference
- Built specifically for Next.js App Router with Server Actions
- Redis-backed sessions with automatic refresh out of the box
- Built-in CSRF protection, secure cookie handling, bcrypt password hashing
- Plugin system for future features (2FA, OAuth, etc.)

All "NEEDS CLARIFICATION" items from Technical Context are now resolved.

---

## Next Steps

1. **Phase 1**: Generate data model and API contracts based on these decisions
2. Update Technical Context in plan.md with resolved decisions
3. Create quickstart.md with development environment setup
4. Re-evaluate Constitution Check gates post-design
