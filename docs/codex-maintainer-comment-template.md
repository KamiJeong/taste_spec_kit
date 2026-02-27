# Codex Maintainer Comment Templates

Use these templates on GitHub issues for consistent Codex-human handoff.

## Blocked Notice

```md
Status: blocked

Reason:
- <short blocker summary>

What Codex checked:
- <check 1>
- <check 2>

Required maintainer actions:
- [ ] <action 1>
- [ ] <action 2>

After completion, comment:
/codex resume
```

## Ready Notice

```md
Status: ready

Codex can execute this issue end-to-end.
Next steps:
- create branch `feature/<task-name>`
- generate/update spec -> plan -> tasks
- implement and validate against acceptance criteria
```

## Resume Confirmation

```md
Maintainer actions confirmed.
Codex may continue from this issue state.
```
