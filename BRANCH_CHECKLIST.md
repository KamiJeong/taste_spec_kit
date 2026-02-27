# Branch Checklist

Use this before starting a new task branch.

## Allowed Branch Prefixes

- `feature/<name>`
- `hotfix/<name>`
- `release/<name>`

Source: `.github/workflows/branch-name-policy.yml`

## Quick Checks

1. Check current branch: `git branch --show-current`
2. Create branch with valid prefix:
   - `git checkout -b feature/<task-name>`
3. Verify after create: `git branch --show-current`
