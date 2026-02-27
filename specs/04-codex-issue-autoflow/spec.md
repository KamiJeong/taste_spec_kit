Tech-Stack: specs/00-tech-stack.md

# Feature Specification: Codex Issue Autoflow

**Feature Branch**: `feature/codex-issue-autoflow`  
**Created**: 2026-02-27  
**Status**: In Progress (Initial automation added: label sync workflow)  
**Input**: "issue intake -> codex triage -> autonomous work or maintainer-blocked handoff flow"

## Scope

- 포함: GitHub issue form 템플릿, 라벨 정책, triage/handoff 운영 문서
- 포함: issue form 기반 `kind/prio/area` 자동 라벨 동기화 워크플로우(초기 자동화)
- 포함: spec-kit 연동 규칙(spec -> plan -> tasks) 정의
- 제외: 완전 자동 구현(실제 bot 실행/branch 생성/PR 작성 전체 자동화)

## Problem Statement

현재는 이슈가 들어왔을 때 Codex가 바로 실행 가능한지, 사람 개입이 필요한지 기준이 표준화되어 있지 않다.  
그 결과, 이슈 품질 편차와 handoff 지연이 발생한다.

## Goals

1. 이슈 입력 품질을 표준화한다.
2. Codex triage 결과를 라벨 상태로 명확히 표현한다.
3. 사람 개입이 필요한 경우 maintainer action을 구조화한다.
4. 구현 전 단계에서 spec-kit 문서 흐름과 정합성을 보장한다.

## User Scenarios & Testing

### User Story 1 - Reporter intake 표준화 (Priority: P1)

Reporter는 단일 양식으로 문제/범위/수용기준을 제출한다.

**Independent Test**: 새 이슈가 템플릿 필수 항목 없이 생성되지 않는다.

### User Story 2 - Codex triage 상태 관리 (Priority: P1)

Codex/maintainer는 라벨로 현재 상태(ready/running/blocked/done)를 추적한다.

**Independent Test**: 임의 이슈 3건을 샘플 triage할 때 상태 전이 규칙이 일관된다.

### User Story 3 - Blocked handoff 명확화 (Priority: P2)

사람 작업이 필요하면 maintainer에게 필요한 행동이 체크리스트로 전달된다.

**Independent Test**: blocked 템플릿으로 unblocking 후 `/codex resume` 재개가 가능하다.

## Requirements

### Functional Requirements

- **FR-CIA-001**: 저장소는 Codex 전용 issue intake 템플릿을 제공해야 한다.
- **FR-CIA-002**: intake 템플릿은 problem/scope/acceptance criteria를 필수로 수집해야 한다.
- **FR-CIA-003**: 저장소는 blocker 해제(maintainer action 완료) 템플릿을 제공해야 한다.
- **FR-CIA-004**: triage 정책 문서는 라벨 taxonomy와 상태 전이 규칙을 정의해야 한다.
- **FR-CIA-005**: 정책 문서는 autonomous 실행 기준과 blocked 기준을 모두 명시해야 한다.
- **FR-CIA-006**: blocked 시 maintainer comment 템플릿을 제공해야 한다.
- **FR-CIA-007**: spec-kit 정합 규칙(Tech-Stack header, spec->plan->tasks)을 정책에 포함해야 한다.
- **FR-CIA-008**: 본 기능의 spec/plan/tasks 문서는 `Tech-Stack: specs/00-tech-stack.md`를 포함해야 한다.
- **FR-CIA-009**: Codex Work Request form의 `Request Kind/Priority/Area` 값은 `kind:*/prio:*/area:*` 라벨로 자동 동기화되어야 한다.

### Key Entities

- **Codex Work Request**: 구현/수정/정제 요청을 정의하는 intake issue
- **Codex State Label**: `triage/ready/running/blocked/done` 상태 표현 라벨
- **Human Dependency Label**: `needs:*` 계열 의존성 라벨
- **Maintainer Action Comment**: blocked 해소를 위한 체크리스트 코멘트

## Success Criteria

- **SC-CIA-001**: 새 이슈는 표준 intake 템플릿으로 생성 가능해야 한다.
- **SC-CIA-002**: triage 정책 문서에서 라벨/상태 전이/결정 기준이 누락 없이 정의되어야 한다.
- **SC-CIA-003**: blocked/ready 코멘트 템플릿을 통해 maintainer handoff 시간이 단축되어야 한다.
- **SC-CIA-004**: 다음 단계(자동화 구현) 전에 문서 리뷰로 운영 절차 합의가 완료되어야 한다.
- **SC-CIA-005**: issue 생성/수정 시 `kind/prio/area` 라벨 자동 동기화가 일관되게 동작해야 한다.
