Tech-Stack: specs/00-tech-stack.md

# Email Verification Runbook (Local -> Production)

## Why This Exists

`users.email_verified` stays `false` until `GET /api/v1/auth/verify-email?token=...` is completed.
If mail delivery or link host configuration is wrong, users never reach the verify endpoint.

## Symptoms

- Signup succeeds, but login remains blocked.
- DB `users.email_verified` remains `false`.
- Verification/reset links point to wrong host/port.
- Reset/verify page opens but token is missing or invalid.

## Root Causes (Most Common)

1. `APP_BASE_URL` points to API host instead of frontend host.
2. No SMTP provider/server is configured for current environment.
3. Local debug mode does not expose token (`MAIL_EXPOSE_TOKENS=false`) and no mail inbox exists.
4. Frontend/backend host mismatch (`3001` vs `3000`) breaks user journey.

## Environment Rules

### Local Development

- `MAIL_TRANSPORT=log`
- `MAIL_EXPOSE_TOKENS=true` (debug only)
- `APP_BASE_URL=http://localhost:3001` (frontend host)

Expected behavior:
- Signup response can include `verificationToken` (debug mode).
- Verify via:
  - frontend: `http://localhost:3001/verify-email?token=<token>`
  - API: `GET /api/v1/auth/verify-email?token=<token>`

### Staging

- `MAIL_TRANSPORT=smtp`
- `MAIL_EXPOSE_TOKENS=false`
- `APP_BASE_URL=https://<staging-frontend-domain>`

Expected behavior:
- Real email sent via SMTP.
- Link host must be staging frontend domain.

### Production

- `MAIL_TRANSPORT=smtp`
- `MAIL_EXPOSE_TOKENS=false` (mandatory)
- `APP_BASE_URL=https://<production-frontend-domain>`
- SMTP provider credentials required (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`)

Expected behavior:
- Verification/reset links land on frontend domain.
- Frontend calls backend API to complete verify/reset flow.

## Pre-Release Checklist

1. `APP_BASE_URL` equals deployed frontend origin (not API origin).
2. SMTP connectivity test passes from API runtime.
3. `MAIL_EXPOSE_TOKENS=false` in stage/prod.
4. End-to-end flow passes:
   - signup -> verify-email -> login
   - forgot-password -> reset-password -> login
5. DB assertion: after verify endpoint success, `users.email_verified=true`.
6. Monitoring/alerts include mail send failures and verification failure rate.

## Quick Verification Commands

1. Signup user via frontend or API.
2. Get token:
   - local(debug): response body token or API log (`MAIL_TRANSPORT=log`)
   - stage/prod: mailbox message link
3. Open verify link and confirm success response.
4. Confirm DB row transitions:
   - `email_verified: false -> true`

## Troubleshooting Matrix

- Link host is `localhost:3000`:
  - Fix `APP_BASE_URL` to frontend host and restart API.
- No email received:
  - Check `MAIL_TRANSPORT`, SMTP credentials, provider logs.
- Token invalid/expired:
  - Request new verification/reset link and retry.
- Frontend shows CORS/network issues:
  - Use Next proxy/rewrites and same-origin API calls.

## Security Notes

- Never enable `MAIL_EXPOSE_TOKENS=true` in staging/production.
- Never expose SMTP credentials in repository.
- Treat verification/reset tokens as sensitive one-time credentials.
