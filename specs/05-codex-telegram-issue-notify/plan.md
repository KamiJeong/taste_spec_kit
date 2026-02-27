Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Codex Telegram Issue Notify

**Branch**: `feature/codex-telegram-issue-notify` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/05-codex-telegram-issue-notify/spec.md`

## Summary

Codex progress label 이벤트를 기반으로 Telegram 알림 + GitHub issue comment를 자동 생성한다.
알림은 phase 추적을 위한 운영 보조 채널이며, secret 미설정 환경에서도 실패하지 않도록 설계한다.

## Technical Context

- **Platform**: GitHub Actions (`issues:labeled`)
- **External API**: Telegram Bot API (`sendMessage`)
- **Secrets**:
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_CHAT_ID`
- **Repository artifacts**:
  - workflow (`.github/workflows/codex-issue-progress-notify.yml`)
  - setup docs (`docs/telegram-bot-template.md`)
  - label bootstrap (`tooling/seed-github-labels.ps1`)

## Phases

1. Phase label 정의(`spec-done`,`plan-done`,`tasks-done`)
2. workflow 트리거 조건 구성 (`issues:labeled`)
3. Telegram payload 생성/전송
4. issue comment audit trail 작성
5. secret 누락 시 graceful skip 처리
6. 운영 문서화(봇 생성/secret 설정/테스트 절차)

## Risks and Mitigations

- 리스크: secret 미설정으로 알림 누락
  완화: workflow 로그에 skip 사유 명시 + issue comment는 항상 생성
- 리스크: 라벨 오탈자/정의 누락
  완화: label seed script에 phase label 포함
- 리스크: 알림 과다
  완화: phase 완료 라벨 3종 이벤트만 트리거

## Exit Criteria

- workflow 파일 추가 완료
- Telegram setup template 문서 추가 완료
- label seed script에 phase label 반영 완료
- spec/plan/tasks 문서화 완료
