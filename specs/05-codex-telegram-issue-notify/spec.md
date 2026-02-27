Tech-Stack: specs/00-tech-stack.md

# Feature Specification: Codex Telegram Issue Notify

**Feature Branch**: `feature/codex-telegram-issue-notify`  
**Created**: 2026-02-27  
**Status**: In Progress  
**Input**: "when codex got issues, notify telegram + show codex phase progress + write issue comment"

## Scope

- 포함: `spec-done/plan-done/tasks-done` 라벨 기반 알림 워크플로우
- 포함: Telegram bot secret 기반 메시지 전송 템플릿
- 포함: GitHub issue comment 자동 기록
- 제외: Codex 실행 자체 자동화(브랜치 생성/코드 구현 자동 시작)

## User Scenarios & Testing

### User Story 1 - Phase progress 알림 (Priority: P1)

Maintainer는 Codex의 문서 단계 진행(`spec/plan/tasks done`)을 Telegram으로 받는다.

**Independent Test**: 이슈에 `spec-done` 라벨 추가 시 Telegram 메시지가 도착한다.

### User Story 2 - Issue audit trail (Priority: P1)

Maintainer는 이슈 내 코멘트로 Codex 단계 진행을 추적할 수 있다.

**Independent Test**: phase label 추가 시 이슈 코멘트가 자동 생성된다.

### User Story 3 - Safe fallback (Priority: P2)

Telegram secret 미설정이어도 워크플로우는 실패하지 않고 코멘트 기록은 유지된다.

**Independent Test**: secret 없이 실행 시 Telegram step skip + issue comment 생성 확인.

## Requirements

### Functional Requirements

- **FR-CTN-001**: 저장소는 phase label(`spec-done`,`plan-done`,`tasks-done`)를 정의해야 한다.
- **FR-CTN-002**: 해당 라벨이 이슈에 추가되면 알림 워크플로우가 실행되어야 한다.
- **FR-CTN-003**: Telegram 메시지는 repo/issue/phase/link 정보를 포함해야 한다.
- **FR-CTN-004**: Telegram secret 미설정 시 워크플로우는 실패하지 않고 skip해야 한다.
- **FR-CTN-005**: phase 라벨 이벤트마다 GitHub issue comment를 자동 작성해야 한다.
- **FR-CTN-006**: Telegram 설정 방법 문서를 저장소 내에서 제공해야 한다.
- **FR-CTN-007**: 본 기능 spec/plan/tasks는 `Tech-Stack: specs/00-tech-stack.md`를 포함해야 한다.

## Success Criteria

- **SC-CTN-001**: phase 라벨 추가 시 알림 워크플로우가 일관되게 실행된다.
- **SC-CTN-002**: Telegram 설정 시 실메시지 전송이 확인된다.
- **SC-CTN-003**: 각 phase 이벤트에서 issue comment audit trail이 남는다.
