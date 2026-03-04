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

## Spec Kit Workflow Rule (Mandatory)

- This repository uses Spec Kit as the default delivery workflow.
- Do not start implementation before feature docs are created in `specs/<id>-<feature-name>/`.
- Required order:
  1. `spec.md`
  2. `plan.md`
  3. `tasks.md`
  4. implementation
- Every new feature branch must map to a corresponding Spec Kit folder and docs set.

## Branch Start Checklist

1. Check current branch: `git branch --show-current`
2. Create a valid branch: `git checkout -b feature/<task-name>`
3. Verify branch name again: `git branch --show-current`
