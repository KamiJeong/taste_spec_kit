# Implementation Checklist (generated)

This checklist summarizes the remaining implementation work for the feature `이메일 기반 회원가입 및 회원관리`.

- [x] T051 Create SignupDTO in apps/api/src/auth/dto/signup.dto.ts
- [x] T052 Create VerifyEmailDTO in apps/api/src/auth/dto/verify-email.dto.ts
- [x] T053 Create ResendVerificationDTO in apps/api/src/auth/dto/resend-verification.dto.ts
- [x] T054 Implement AuthService.signup() in apps/api/src/auth/auth.service.ts
- [x] T055 Implement AuthService.verifyEmail() in apps/api/src/auth/auth.service.ts
- [x] T056 Implement AuthService.resendVerification() in apps/api/src/auth/auth.service.ts
- [x] T057 Create EmailService.sendVerificationEmail() in apps/api/src/email/email.service.ts
- [x] T058 Create email verification template in apps/api/src/email/templates/verification-email.html
- [x] T059 Implement POST /api/v1/auth/signup endpoint in apps/api/src/auth/auth.controller.ts
- [x] T060 Implement GET /api/v1/auth/verify-email endpoint in apps/api/src/auth/auth.controller.ts
- [x] T061 Implement POST /api/v1/auth/resend-verification endpoint in apps/api/src/auth/auth.controller.ts
- [x] T062 Add AuthLog entries for SIGNUP and EMAIL_VERIFIED events in AuthService

# Frontend (high priority)

- [ ] T063 Create SignupForm component in apps/web/src/components/auth/SignupForm.tsx
- [ ] T064 Create email verification page in apps/web/src/app/(auth)/verify-email/page.tsx
- [ ] T065 Create signup page in apps/web/src/app/(auth)/signup/page.tsx
- [ ] T066 Implement signup API call in SignupForm using api-client

# Notes

- Several foundational items (database schemas, validators, email queue & processor) are already implemented in the repository.
- The checklist above is intentionally conservative: it lists only high-priority unfinished tasks required to enable signup + verify email flow (US1).
- For phase 2+ tasks, refer to `specs/01-email-auth-user-management/tasks.md` for the full list.
