# Copilot Reviewer Guide

Use this guide when requesting Copilot review on any PR in this repository.

## Global Review Priority

1. Correctness and regressions
- Behavior matches stated requirement and existing contracts.
- Edge cases and failure paths are handled consistently.

2. Security and safety
- Input validation, authz/authn boundaries, and error handling are sound.
- No secret values or credentials are hardcoded.
- Logging avoids sensitive data leaks.

3. Architecture and contracts
- Module boundaries are respected.
- Shared package/API contracts stay in sync with usage.
- Naming and structure are coherent with project conventions.

4. Data and compatibility
- Schema/migration changes are safe and reversible when possible.
- Backward compatibility risks are called out.

5. Test and CI health
- Tests cover changed behavior at the right level.
- CI/workflow/tooling changes are stable and reproducible.

## Domain Focus Areas

### Backend API
- `apps/api/src/`
- `packages/contracts-auth/src/`
- Focus: request/response contracts, validation, persistence, and service/controller boundaries.

### Frontend/UI
- `apps/*/src/` (UI apps)
- `packages/ui/`
- Focus: state transitions, accessibility, visual regressions, and contract usage.

### CI/Infra
- `.github/workflows/`
- `docker-compose.yml`
- Root workspace/tooling config files.
- Focus: deterministic installs, cache/tool versions, and pipeline reliability.

### Docs/Specs
- `specs/`
- Root docs and setup guides.
- Focus: alignment with implementation and removal of stale instructions.

### Auth Backend (Specialized)
- `apps/api/src/modules/auth/`
- `apps/api/src/modules/user/`
- `apps/api/src/modules/session/`
- `apps/api/src/modules/shared/`
- `packages/contracts-auth/src/`
- `.github/workflows/backend-ci.yml`
- Focus: signup/signin/session/token correctness, idempotency, lockout, audit logging, and envelope consistency.

## Fast PR Checklist (Copy/Paste)

```md
## Reviewer Guide (Copilot)
Please focus on:
1. Correctness/regression risks
2. Security and sensitive-data handling
3. Contract and architecture consistency
4. Migration/compatibility impact
5. Test coverage gaps

Relevant sections:
- Backend API / Frontend UI / CI-Infra / Docs / Auth Backend (select what applies)

Start at changed files in this PR, then expand to related contracts/workflows.
```
