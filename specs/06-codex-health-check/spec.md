Tech-Stack: specs/00-tech-stack.md

# Feature Specification: Codex Health Check

**Feature Branch**: `feature/codex-health-check`  
**Created**: 2026-02-27  
**Status**: In Progress  
**Input**: "github actions health check for codex issue pipeline"

## Scope

- 포함: Codex issue pipeline 핵심 파일/규칙 검증 워크플로우
- 포함: 수동 실행(`workflow_dispatch`) + 일일 스케줄 실행
- 제외: 실제 issue 생성/라벨 변경 e2e 실행

## Requirements

- **FR-CHC-001**: `codex-health-check` 워크플로우는 수동/일일 스케줄로 실행되어야 한다.
- **FR-CHC-002**: Codex 관련 필수 파일 존재 여부를 검증해야 한다.
- **FR-CHC-003**: issue form 필드(`Request Kind/Priority/Area`) 존재를 검증해야 한다.
- **FR-CHC-004**: label sync workflow 핵심 규칙을 검증해야 한다.
- **FR-CHC-005**: progress notify workflow 핵심 규칙을 검증해야 한다.
- **FR-CHC-006**: label seed script의 핵심 라벨 집합을 검증해야 한다.
- **FR-CHC-007**: triage policy 문서에 주요 상태/진행 라벨이 포함되어야 한다.
- **FR-CHC-008**: 본 기능 spec/plan/tasks 문서는 `Tech-Stack: specs/00-tech-stack.md`를 포함해야 한다.

## Success Criteria

- **SC-CHC-001**: 워크플로우가 수동 실행에서 통과한다.
- **SC-CHC-002**: 핵심 파일/필드/라벨 규칙 drift 발생 시 워크플로우가 실패한다.
