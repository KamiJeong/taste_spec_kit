Tech-Stack: specs/00-tech-stack.md

# Feature Specification: README Spec Kit Progress & History

**Feature Branch**: `feature/readme-spec-kit-progress-history`  
**Created**: 2026-03-05  
**Status**: Draft  
**Input**: "show how much we developed with Spec Kit + Codex, and what was tried with dates"

## Summary

README에 Spec Kit 기반 진행 현황과 날짜 기반 시도 이력(History) 진입점을 명확히 추가한다.

## Scope

### In Scope

- `README.md`에 Spec Kit 진행 현황 섹션 추가
- `README.md`에 날짜 기반 히스토리 링크 섹션 추가
- `specs/history`에 최신 날짜 이력 문서 추가

### Out of Scope

- 기존 기능 코드 변경
- 과거 모든 히스토리 문서 상세 재작성

## Functional Requirements

- **FR-RH-001**: README는 현재 Spec Kit 진행 현황을 표 형태로 제공해야 한다.
- **FR-RH-002**: README는 날짜 기반 히스토리 링크를 제공해야 한다.
- **FR-RH-003**: 새로운 히스토리 문서에는 날짜, 시도 내용, 결과가 포함되어야 한다.
- **FR-RH-004**: README는 앞으로의 히스토리 기록 규칙(신규 머지 시 날짜 엔트리 추가)을 명시해야 한다.

## Success Criteria

- **SC-RH-001**: 신규 팀원이 README만 보고 현재 Spec Kit 진행 상태를 파악할 수 있다.
- **SC-RH-002**: 최근 작업 이력을 날짜 기준으로 빠르게 탐색할 수 있다.
