Tech-Stack: specs/00-tech-stack.md

# Tasks: Codex Issue Autoflow

## Execution Rule

- 우선순위: `P1 -> P2`
- 본 단계는 운영 문서/템플릿 정립까지 수행
- bot/automation 구현은 후속 기능으로 분리

## Phase 1: Intake Foundation (P1)

- [x] CIA-T001 `.github/ISSUE_TEMPLATE/config.yml` 추가
- [x] CIA-T002 `codex-work-request.yml` 템플릿 추가
- [x] CIA-T003 필수 항목(problem/scope/acceptance criteria/autonomous 여부) 반영

## Phase 2: Blocked Handoff Foundation (P1)

- [x] CIA-T004 `codex-blocker-resolution.yml` 템플릿 추가
- [x] CIA-T005 blocked -> resume 운영 절차 문서화
- [x] CIA-T006 maintainer 코멘트 템플릿 문서 추가

## Phase 3: Policy Documentation (P1)

- [x] CIA-T007 label taxonomy 문서화
- [x] CIA-T008 autonomous vs blocked decision rule 문서화
- [x] CIA-T009 spec-kit 정합 규칙(Tech-Stack, spec->plan->tasks) 명시
- [x] CIA-T009A GitHub label bootstrap 스크립트 추가 (`tooling/seed-github-labels.ps1`)

## Phase 4: Spec Kit Alignment (P2)

- [x] CIA-T010 `specs/04-codex-issue-autoflow/spec.md` 작성
- [x] CIA-T011 `specs/04-codex-issue-autoflow/plan.md` 작성
- [x] CIA-T012 `specs/04-codex-issue-autoflow/tasks.md` 작성
- [ ] CIA-T013 운영 리뷰 후 refine cycle 반영

## Phase 5: Initial Automation (P2)

- [x] CIA-T014 issue form 필드(`Request Kind/Priority/Area`)를 라벨로 동기화하는 GitHub Action 추가
- [x] CIA-T015 라벨 동기화 시 기존 `kind:/prio:/area:` 그룹 라벨 정리 후 재적용 규칙 반영

## Done Checklist

- [x] FR-CIA-001~009 문서/템플릿/초기 자동화 기준 충족
- [x] 운영 기준 문서와 템플릿이 상호 참조 가능
- [ ] maintainer 실제 trial 1회 이상 수행
