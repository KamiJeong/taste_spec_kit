# Specification Analysis Report

**Feature**: 이메일 기반 회원가입 및 회원관리  
**Branch**: 02-email-auth-user-management  
**Date**: 2026-02-09  
**Analyzed Artifacts**: spec.md, plan.md, tasks.md, data-model.md, contracts/, research.md, quickstart.md

---

## Executive Summary

**Overall Status**: ✅ **PASS** - Feature specification is well-structured and ready for implementation with minor improvements recommended.

**Critical Issues**: 0  
**High Priority Issues**: 2  
**Medium Priority Issues**: 5  
**Low Priority Issues**: 3

**Coverage**: 95% (19/20 functional requirements have task coverage)

---

## Findings Table

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | HIGH | spec.md FR-009 vs research.md | Spec mentions "bcrypt 또는 argon2" but research.md decisively chooses Argon2id | Update spec.md FR-009 to reflect the decision: "argon2id (per research.md)" |
| I2 | Inconsistency | HIGH | spec.md FR-010 vs research.md | Spec says "세션 또는 JWT" but research.md chooses Redis sessions explicitly | Update spec.md FR-010 to "Redis-based server sessions (per research.md)" |
| C1 | Coverage Gap | MEDIUM | spec.md FR-019 (Rate Limiting) | Rate limiting task exists (T076, T038) but not explicitly for "account lockout after 5 failed attempts" logic | Add explicit task for account lockout logic in T080 description or create new task |
| C2 | Coverage Gap | MEDIUM | spec.md Success Criteria SC-006 | No load testing task for "1,000 concurrent users" | Add optional task in Phase 9 (Polish) for load testing with k6 or similar |
| A1 | Ambiguity | MEDIUM | spec.md FR-015 | "프로필 정보(이름, 이메일)" - spec says email is editable but also mentions FR-016 re-verification | Clarify that email IS editable but requires re-verification (FR-016) |
| A2 | Ambiguity | MEDIUM | plan.md Constitution Check | "비밀번호 해시 비용 인자는 보안과 성능 균형 고려 (bcrypt rounds: 10-12)" mentions bcrypt but uses Argon2id | Update to Argon2id parameters from research.md |
| D1 | Duplication | MEDIUM | spec.md Edge Cases vs Functional Requirements | "무차별 대입 공격" is both in Edge Cases and FR-019 | Keep FR-019 as normative, remove duplication from Edge Cases or reference FR-019 |
| T1 | Terminology Drift | LOW | "이름" vs "name" vs "display_name" | spec.md uses "이름", data-model.md uses "name", User entity in spec.md uses "표시 이름" | Standardize to "name" in English docs, "이름" in Korean docs, "name" field in database |
| T2 | Terminology Drift | LOW | "계정 비활성화" vs "deactivate" vs "is_active" | Multiple terms for same concept across artifacts | Accept as acceptable bilingual drift (Korean UI vs English code) |
| U1 | Underspecification | LOW | tasks.md T012 | "Setup Docker Compose... and Mailhog" but docker-compose.yml (attached) doesn't include Mailhog | Add Mailhog service to docker-compose.yml or update task to note it's optional |

---

## Detailed Analysis

### 1. Constitution Alignment ✅

**Status**: All 8 principles satisfied with minor clarifications needed

| Principle | Status | Notes |
|-----------|--------|-------|
| SSOT | ✅ PASS | @repo/database, @repo/types clearly established |
| Overrides-Only | ✅ PASS | @repo/config base configs, minimal app overrides |
| Pinned-Stack | ✅ PASS | All dependencies versioned, specs/00-tech-stack.md referenced |
| Local-First | ⚠️ MINOR | Docker Compose missing Mailhog (see U1) |
| Cost-Aware | ✅ PASS | Redis caching, email queues, session optimization covered |
| Boundaries | ✅ PASS | Clear module separation in Turborepo structure |
| Type-Safety | ✅ PASS | TypeScript strict, Drizzle ORM, Zod throughout |
| Spec-Before-Code | ✅ PASS | spec.md → plan.md → tasks.md workflow followed |

**Constitution Violations**: **NONE**

---

### 2. Requirements Coverage Analysis

**Total Functional Requirements**: 20 (FR-001 to FR-020)  
**Requirements with Task Coverage**: 19 (95%)  
**Unmapped Requirements**: 1

#### Coverage Details

| Requirement | Coverage Status | Task IDs | Notes |
|-------------|-----------------|----------|-------|
| FR-001 (회원가입) | ✅ COVERED | T054, T051, T059 | Signup service, DTO, endpoint |
| FR-002 (이메일 검증) | ✅ COVERED | T029, T031, T067 | Zod emailSchema, validation |
| FR-003 (비밀번호 강도) | ✅ COVERED | T029, T031, T067 | Zod passwordSchema with regex |
| FR-004 (중복 이메일 방지) | ✅ COVERED | T016 | User schema unique constraint on email |
| FR-005 (이메일 인증 발송) | ✅ COVERED | T057, T058, T055 | EmailService, template, token generation |
| FR-006 (인증 링크 만료 24h) | ✅ COVERED | T055, T017 | EmailVerificationToken.expires_at field |
| FR-007 (미인증 로그인 차단) | ✅ COVERED | T073 | AuthService.login() checks email_verified |
| FR-008 (로그인) | ✅ COVERED | T073, T071, T076 | Login service, DTO, endpoint |
| FR-009 (비밀번호 해시) | ✅ COVERED | T033, T054 | better-auth Argon2id config, signup |
| FR-010 (세션/토큰 생성) | ✅ COVERED | T033, T037, T073 | Redis session via better-auth |
| FR-011 (로그인 실패 메시지) | ✅ COVERED | T076, T041 | Exception filter for consistent errors |
| FR-012 (로그아웃) | ✅ COVERED | T074, T077, T086 | Logout service, endpoint, UI |
| FR-013 (비밀번호 재설정) | ✅ COVERED | T092, T094, T096 | Reset service, email, endpoint |
| FR-014 (재설정 링크 만료 1h) | ✅ COVERED | T092, T018 | PasswordResetToken.expires_at |
| FR-015 (프로필 조회/수정) | ✅ COVERED | T109, T110, T112-T113 | UserService, endpoints |
| FR-016 (이메일 재인증) | ✅ COVERED | T110, T116 | Email change re-verification flow |
| FR-017 (계정 비활성화) | ✅ COVERED | T127, T130, T135 | Deactivate service, endpoint, login check |
| FR-018 (삭제 유예 30일) | ✅ COVERED | T128, T131, T134 | Request deletion, cron job |
| FR-019 (Rate Limiting) | ⚠️ PARTIAL | T038, T076 | Throttler setup, login rate limit, BUT missing explicit account lockout after 5 attempts |
| FR-020 (인증 로그) | ✅ COVERED | T043, T062, T079, T098, T115, T133 | AuthLog service and entries throughout |

**Coverage Gap**: FR-019 partially covered (see finding C1)

---

### 3. User Story Alignment

**Total User Stories**: 5 (P1: 2, P2: 2, P3: 1)  
**User Stories Mapped to Tasks**: 5 (100%)

| User Story | Priority | Task Count | Phase | Status |
|------------|----------|------------|-------|--------|
| US1: 이메일 회원가입 | P1 | 20 tasks | Phase 3 | ✅ Complete coverage |
| US2: 로그인 | P1 | 19 tasks | Phase 4 | ✅ Complete coverage |
| US3: 비밀번호 재설정 | P2 | 17 tasks | Phase 5 | ✅ Complete coverage |
| US4: 프로필 관리 | P2 | 18 tasks | Phase 6 | ✅ Complete coverage |
| US5: 계정 비활성화 | P3 | 19 tasks | Phase 7 | ✅ Complete coverage |

**All user stories have complete end-to-end task coverage** from backend API to frontend UI.

---

### 4. Data Model Consistency

**Entities in spec.md**: 5 (User, EmailVerificationToken, PasswordResetToken, Session, AuthLog)  
**Entities in data-model.md**: 5 (same)  
**Entities in tasks.md schema tasks**: 4 (Session managed by better-auth, not in tasks)

**Consistency**: ✅ **PASS**

All entities referenced in spec.md Key Entities section are properly defined in data-model.md and have corresponding Drizzle schema tasks (T016-T019).

**Field Alignment**:
- ✅ User entity fields match across spec.md and data-model.md
- ✅ Token entities have all required fields (id, user_id, token, expires_at, used_at, created_at)
- ✅ AuthLog has all required fields including metadata JSONB

---

### 5. API Contract Coverage

**Endpoints in contracts/auth-api.md**: 8 endpoints  
**Endpoints in contracts/user-api.md**: 6 endpoints  
**Total**: 14 API endpoints

**Task Coverage**: ✅ 100% - All 14 endpoints have implementation tasks

| Endpoint | Task ID | Status |
|----------|---------|--------|
| POST /auth/signup | T059 | ✅ |
| GET /auth/verify-email | T060 | ✅ |
| POST /auth/resend-verification | T061 | ✅ |
| POST /auth/login | T076 | ✅ |
| POST /auth/logout | T077 | ✅ |
| GET /auth/me | T078 | ✅ |
| POST /auth/forgot-password | T096 | ✅ |
| POST /auth/reset-password | T097 | ✅ |
| GET /users/profile | T112 | ✅ |
| PATCH /users/profile | T113 | ✅ |
| POST /users/change-password | T114 | ✅ |
| POST /users/deactivate | T130 | ✅ |
| POST /users/request-deletion | T131 | ✅ |
| POST /users/cancel-deletion | T132 | ✅ |

Additional endpoint in contracts but not in core spec: GET /users/activity-log (T144) - This is a bonus feature, not a gap.

---

### 6. Research Decisions Implementation

**Total Decisions in research.md**: 7 key decisions  
**Decisions Reflected in Tasks**: 7 (100%)

| Decision | Status | Task References |
|----------|--------|-----------------|
| 1. Argon2id password hashing | ✅ IMPLEMENTED | T033 (better-auth config) |
| 2. Redis-based server sessions | ✅ IMPLEMENTED | T033, T037 (Redis connection, better-auth session) |
| 3. Flexible SMTP abstraction (Mailhog dev) | ⚠️ PARTIAL | T057 (EmailService), BUT Mailhog not in docker-compose.yml (see U1) |
| 4. Redis + NestJS Throttler rate limiting | ✅ IMPLEMENTED | T038 (Throttler setup) |
| 5. BullMQ email queue | ✅ IMPLEMENTED | T039, T040 (Queue and processor) |
| 6. crypto.randomBytes token generation | ✅ IMPLEMENTED | T044 (Token generator utility) |
| 7. Drizzle Kit migrations | ✅ IMPLEMENTED | T022-T024 (Client, migrations, apply) |

**Implementation Alignment**: 7/7 decisions have tasks, but 1 needs docker-compose.yml update (Mailhog).

---

### 7. Architecture Consistency

**Turborepo Structure**:
- ✅ apps/api and apps/web properly separated
- ✅ packages/@repo/* correctly referenced in tasks
- ✅ All task file paths use Turborepo structure
- ✅ No references to old backend/frontend structure

**Module Boundaries** (NestJS):
- ✅ Auth Module (T034): Separate from User Module
- ✅ User Module (T035): No circular dependency on Auth
- ✅ Email Module (T036): Independent service layer
- ✅ Guards (T072): Proper separation of concerns

**No boundary violations detected**.

---

### 8. Ambiguity Scan

**Vague Terms Found**: 2

| Term | Location | Issue | Recommendation |
|------|----------|-------|----------------|
| "안전하게 해시" | spec.md FR-009 | Clarification: bcrypt OR argon2? Research chose argon2id | See I1 |
| "세션 또는 JWT 토큰" | spec.md FR-010 | Clarification: Which one? Research chose Redis sessions | See I2 |

**Unresolved Placeholders**: None found (no TODO, TKTK, ???, `<placeholder>` in any artifact)

**Measurability Check**:
- ✅ SC-001: "3분 이내" - measurable
- ✅ SC-002: "500ms 이내, 95%" - measurable
- ✅ SC-003: "80% 이상" - measurable
- ⚠️ SC-006: "1,000명의 동시 로그인" - measurable but no load test task (see C2)
- ✅ All other success criteria have measurable outcomes

---

### 9. Duplication Detection

**Near-Duplicate Content**:

| Primary Location | Duplicate Location | Severity | Notes |
|------------------|-------------------|----------|-------|
| spec.md FR-019 (Rate Limiting) | spec.md Edge Cases "무차별 대입 공격" | MEDIUM | Same requirement stated twice; see D1 |
| plan.md Constitution Check | constitution.md 8 principles | EXPECTED | This is intentional reference, not duplication |

**Recommendation**: Consolidate FR-019 and edge case mention (see D1).

---

### 10. Unmapped Tasks

**Tasks with No Direct Requirement**:

| Task ID | Description | Analysis |
|---------|-------------|----------|
| T144-T150 | Activity log feature | This is a value-add feature beyond spec requirements; acceptable |
| T151-T195 | Phase 9 Polish tasks | These are cross-cutting improvements (security, performance, docs); acceptable |

**All tasks are justified** - either map to requirements or are necessary infrastructure/polish.

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Functional Requirements | 20 |
| Total User Stories | 5 |
| Total Tasks | 195 |
| Requirements with >=1 Task | 19 |
| **Coverage Percentage** | **95%** |
| Ambiguity Count | 2 |
| Duplication Count | 1 |
| Critical Issues | 0 |
| High Issues | 2 |
| Medium Issues | 5 |
| Low Issues | 3 |
| Constitution Violations | 0 |

---

## Success Criteria Analysis

**Measurability**: 8/10 success criteria are fully measurable and testable

| ID | Criterion | Status | Notes |
|----|-----------|--------|-------|
| SC-001 | 3분 내 회원가입-인증 | ✅ Measurable | Can be validated with E2E test |
| SC-002 | 95% 로그인 500ms 이내 | ✅ Measurable | Load test can validate |
| SC-003 | 비밀번호 재설정 80% 완료율 | ✅ Measurable | Analytics tracking |
| SC-004 | 이메일 전달률 95% 이상 | ✅ Measurable | Email service metrics |
| SC-005 | Brute force 차단율 100% | ✅ Measurable | Test with automated attacks |
| SC-006 | 1,000명 동시 로그인 | ⚠️ Missing Test | No load test task (see C2) |
| SC-007 | 평문 비밀번호 0건 | ✅ Measurable | Code review + DB audit |
| SC-008 | E2E 테스트 자동 검증 | ⚠️ Optional | Tests not in scope per tasks.md |
| SC-009 | 실시간 검증 에러 표시 | ✅ Measurable | UI testing |
| SC-010 | 보안 이벤트 100% 로그 | ✅ Measurable | AuthLog audit |

**Note**: SC-008 (E2E tests) is marked optional because the specification doesn't explicitly request tests, and tasks.md follows this by excluding test tasks.

---

## Constitution Alignment Issues

**Status**: ✅ **NO VIOLATIONS**

All 8 constitution principles are fully satisfied:

1. ✅ **SSOT**: @repo/database for schemas, @repo/types for types, specs/00-tech-stack.md for tech decisions
2. ✅ **Overrides-Only**: @repo/config base configs, better-auth defaults with minimal overrides
3. ✅ **Pinned-Stack**: All dependencies versioned, new dependencies documented in research.md
4. ✅ **Local-First**: Docker Compose for local dev (minor: Mailhog not yet in compose file)
5. ✅ **Cost-Aware**: Redis caching, email queues, session optimization, API call minimization
6. ✅ **Boundaries**: Clear Turborepo package structure, no circular dependencies
7. ✅ **Type-Safety**: TypeScript strict mode, Drizzle ORM, Zod validation throughout
8. ✅ **Spec-Before-Code**: Proper workflow followed (spec → plan → research → tasks)

---

## Recommended Improvements (Priority Order)

### Immediate (Before Implementation Starts)

1. **[I1 - HIGH]** Update spec.md FR-009: Change "bcrypt 또는 argon2" to "argon2id (per research.md decision)"
   
2. **[I2 - HIGH]** Update spec.md FR-010: Change "세션 또는 JWT 토큰" to "Redis-based server sessions (per research.md decision)"

3. **[U1 - MEDIUM]** Add Mailhog to docker-compose.yml:
   ```yaml
   mailhog:
     image: mailhog/mailhog:latest
     container_name: taste_spec_kit_mailhog
     ports:
       - "1025:1025"  # SMTP
       - "8025:8025"  # Web UI
   ```

### Short-term (During Implementation)

4. **[C1 - MEDIUM]** Clarify T080 task description to explicitly mention "Implement account lockout logic after 5 failed login attempts" to fully cover FR-019

5. **[A1 - MEDIUM]** Add note to spec.md FR-015 clarifying that email IS editable but requires re-verification per FR-016

6. **[D1 - MEDIUM]** In spec.md Edge Cases, change "무차별 대입 공격(Brute Force)" to reference FR-019 instead of duplicating the requirement

### Optional (Nice to Have)

7. **[C2 - MEDIUM]** Add load testing task in Phase 9: "T196 [P] Perform load test for 1,000 concurrent users using k6 or Artillery per SC-006"

8. **[A2 - MEDIUM]** Update plan.md Constitution Check to reference Argon2id parameters instead of bcrypt

9. **[T1-T2 - LOW]** Document terminology conventions (English code vs Korean UI) in a glossary or README

---

## Next Actions

### ✅ Ready to Proceed

**Status**: The feature specification is **ready for implementation** with no critical blockers.

**Recommended Path**:

1. ✅ **Proceed with implementation** - No critical issues blocking /speckit.implement
2. ⚠️ **Address High Priority Issues (I1, I2)** - Quick spec.md edits to align with research decisions (5 minutes)
3. ⚠️ **Add Mailhog to docker-compose.yml (U1)** - Align with quickstart.md expectations (2 minutes)
4. ✅ **Medium/Low issues** - Can be addressed during implementation or in code review

### Suggested Commands

```bash
# Option 1: Fix spec inconsistencies first (recommended)
# Manually edit spec.md to update FR-009 and FR-010
# Add Mailhog to docker-compose.yml
# Then proceed with implementation

# Option 2: Proceed immediately (acceptable)
# /speckit.implement
# The inconsistencies (I1, I2) are between spec and research.md,
# but research.md decisions will be followed during implementation anyway
```

### If You Want Perfect Alignment

To achieve 100% consistency before implementation:

1. Edit `spec.md` lines 139-140:
   - FR-009: Remove "bcrypt 또는 argon2", specify "argon2id"
   - FR-010: Remove "세션 또는 JWT 토큰", specify "Redis-based server sessions"

2. Edit `docker-compose.yml` to add Mailhog service (see U1 recommendation above)

3. Optionally add load testing task (C2) to tasks.md Phase 9

---

## Remediation Offer

Would you like me to **suggest concrete remediation edits** for the **top 3 high-priority issues** (I1, I2, U1)?

I can provide exact text replacements for:
- ✏️ spec.md FR-009 and FR-010 updates
- ✏️ docker-compose.yml Mailhog service addition
- ✏️ tasks.md T080 clarification

**Important**: I will NOT make changes automatically (read-only analysis). You must approve and apply edits manually or ask me to apply them.

---

## Conclusion

This feature specification demonstrates **excellent quality** with:

✅ Comprehensive user story coverage (5 stories, all priorities)  
✅ Strong requirements traceability (95% task coverage)  
✅ Full constitution compliance (0 violations)  
✅ Well-structured Turborepo architecture  
✅ Thoughtful research decisions (7/7 implemented)  
✅ Detailed API contracts (14 endpoints, 100% covered)  

**Minor improvements needed** but nothing critical. The feature is **implementation-ready** with confidence.

**Estimated Implementation Time** (based on 195 tasks):
- **MVP (Phases 1-4)**: 89 tasks, ~2-3 weeks solo, ~1-1.5 weeks team of 2
- **Full Feature**: 195 tasks, ~4-6 weeks solo, ~2-3 weeks team of 2-3

**Recommendation**: ✅ **APPROVED FOR IMPLEMENTATION** with minor spec clarifications suggested.

---

**Analysis Completed**: 2026-02-09  
**Artifacts Analyzed**: 7 files (spec, plan, tasks, data-model, contracts×2, research, quickstart)  
**Total Findings**: 10  
**Constitution Compliance**: ✅ PASS (0 violations)


