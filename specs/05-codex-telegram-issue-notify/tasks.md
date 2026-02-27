Tech-Stack: specs/00-tech-stack.md

# Tasks: Codex Telegram Issue Notify

## Execution Rule

- 우선순위: `P1 -> P2`
- phase progress 알림(`spec/plan/tasks done`)에 집중
- Codex 실행 자동화 자체는 범위 제외

## Phase 1: Label and Trigger Foundation (P1)

- [x] CTN-T001 phase label(`spec-done`,`plan-done`,`tasks-done`) 정의를 label seed script에 반영
- [x] CTN-T002 `issues:labeled` 이벤트 기반 workflow 파일 추가
- [x] CTN-T003 phase label 3종에만 반응하도록 조건 구성

## Phase 2: Notification and Comment (P1)

- [x] CTN-T004 Telegram payload 생성(Repo/Issue/Phase/Link)
- [x] CTN-T005 Telegram API(`sendMessage`) 호출 step 구현
- [x] CTN-T006 Issue comment 자동 작성 step 구현
- [x] CTN-T007 secret 미설정 시 skip 처리(실패 방지) 구현

## Phase 3: Documentation (P1)

- [x] CTN-T008 Telegram bot setup 템플릿 문서 추가
- [x] CTN-T009 운영 테스트 절차 문서화

## Phase 4: Spec Kit Alignment (P2)

- [x] CTN-T010 `spec.md` 작성
- [x] CTN-T011 `plan.md` 작성
- [x] CTN-T012 `tasks.md` 작성
- [ ] CTN-T013 실제 repo secret 설정 후 end-to-end 실검증

## Done Checklist

- [x] FR-CTN-001~007 구현/문서 반영
- [x] 템플릿 + workflow + label seed script 정합성 확보
- [ ] Telegram 실메시지 수신 확인
