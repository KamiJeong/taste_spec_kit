# AGENTS

## Branch Naming Rule

Before starting work, branch names must follow one of these patterns:

- `feature/<name>`
- `hotfix/<name>`
- `release/<name>`

Source of truth: `.github/workflows/branch-name-policy.yml`

## Tech Stack Rule (Mandatory)

- All implementation decisions must follow `specs/00-tech-stack.md` as SSOT.
- If there is any conflict, `specs/00-tech-stack.md` takes priority.
- Feature docs (`spec.md`, `plan.md`, `tasks.md`) must include:
  - `Tech-Stack: specs/00-tech-stack.md`

## Branch Start Checklist

1. Check current branch: `git branch --show-current`
2. Create a valid branch: `git checkout -b feature/<task-name>`
3. Verify branch name again: `git branch --show-current`
