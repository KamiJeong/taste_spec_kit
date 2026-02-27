Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Codex Issue Autoflow

**Branch**: `feature/codex-issue-autoflow` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/04-codex-issue-autoflow/spec.md`

## Summary

이 기능은 운영 기반(문서/템플릿) + 초기 자동화(라벨 동기화) 단계다.
우선 GitHub issue 템플릿과 triage 정책을 고정하고, `kind/prio/area` 자동 동기화를 도입한다.
고급 자동화(브랜치 생성/실행/PR 자동화)는 후속 단계로 분리한다.

## Technical Context

- **Platform**: GitHub Issues / Labels / Issue Forms
- **Repository Policy**: branch naming policy + spec-kit workflow
- **Reference SSOT**: `specs/00-tech-stack.md`
- **Deliverable Type**: Markdown docs + `.github/ISSUE_TEMPLATE/*`

## Constitution Check

- SSOT 준수: 문서 상단 Tech-Stack 참조 포함
- Local-first: 로컬에서 문서 검토/수정 가능
- Boundary: 본 단계는 프로세스 정립 중심, 런타임 자동화는 후속 단계

## Project Structure

```text
.github/
└── ISSUE_TEMPLATE/
    ├── config.yml
    ├── codex-work-request.yml
    └── codex-blocker-resolution.yml

docs/
├── issue-triage-policy.md
└── codex-maintainer-comment-template.md

specs/04-codex-issue-autoflow/
├── spec.md
├── plan.md
└── tasks.md
```

## Phases

1. Intake form 정의 (required fields, autonomous 여부)
2. Label taxonomy 및 상태 전이 규칙 문서화
3. Blocked handoff 코멘트 템플릿 문서화
4. Spec-kit 연동 규칙 명시
5. 운영 리뷰 (maintainer 관점 refine)
6. 초기 자동화: issue form -> label sync workflow 적용
7. 후속 자동화(명령 트리거/실행 자동화)는 별도 기능으로 분리

## Risks and Mitigations

- 리스크: 라벨 규칙 과복잡
  완화: 최소 라벨 집합부터 시작 후 운영 데이터 기반 확장
- 리스크: blocked 기준 모호
  완화: autonomous 가능 조건을 checklist 형태로 명문화
- 리스크: 템플릿이 현실 이슈와 불일치
  완화: 2주 운영 후 필드/라벨 개선 사이클 수행

## Exit Criteria

- Intake/blocked 템플릿 추가 완료
- triage 정책 문서 추가 완료
- label sync workflow 추가 완료
- spec/plan/tasks 초안 리뷰 완료
