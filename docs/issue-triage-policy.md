# Codex Issue Triage Policy

This document defines how issues are prepared and triaged for Codex-driven execution.

## Intake Flow

1. Reporter opens a GitHub issue with `Codex Work Request`.
2. Issue starts with label `codex:triage`.
3. Codex evaluates issue completeness and execution feasibility.
4. Codex moves the issue into one of two paths:
   - Autonomous path: `codex:ready` -> `codex:running` -> `codex:done`
   - Blocked path: `codex:blocked` + one or more `needs:*` labels

Initial automation in repository:

- `.github/workflows/codex-issue-label-sync.yml` syncs `kind:*`, `prio:*`, `area:*` from issue form fields.

## Label Bootstrap

Seed or update labels with GitHub CLI:

```powershell
pwsh ./tooling/seed-github-labels.ps1 -Repo "<owner>/<repo>"
```

## Label Taxonomy

### Work classification

- `kind:feature`
- `kind:bug`
- `kind:chore`
- `kind:docs`

### Priority

- `prio:p0`
- `prio:p1`
- `prio:p2`

### Area

- `area:web`
- `area:api`
- `area:infra`
- `area:spec`
- `area:ci`

### Codex state

- `codex:triage`
- `codex:ready`
- `codex:running`
- `codex:blocked`
- `codex:done`

### Human dependency

- `needs:maintainer`
- `needs:product`
- `needs:access`
- `needs:decision`

## Autonomous Decision Rules

Codex can execute end-to-end only when all are true:

- Problem, scope, and acceptance criteria are clear and testable.
- Required access and environment are already available.
- No external manual steps are required during execution.
- No high-risk policy gate is involved (secrets, destructive infra changes, compliance-only decisions).

If any condition fails, Codex must switch to blocked mode.

## Blocked Mode Rules

When blocked, Codex should:

1. Set `codex:blocked`.
2. Add matching `needs:*` labels.
3. Post a maintainer-action comment containing:
   - Block reason
   - What Codex already checked
   - Required human actions (checklist)
   - Resume trigger (`/codex resume`)

Maintainers can use `Codex Blocker Resolution` template to confirm unblocking.

## Spec-Kit Alignment

After triage, implementation-ready issues must map into spec-kit flow:

1. `spec.md`
2. `plan.md`
3. `tasks.md`

All feature docs must include:

- `Tech-Stack: specs/00-tech-stack.md`

Branch naming must follow repository policy:

- `feature/<name>`
- `hotfix/<name>`
- `release/<name>`
