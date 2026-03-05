Tech-Stack: specs/00-tech-stack.md

# Tasks: GitHub Coverage Reporting

## Phase 1: Spec Kit Docs

- [x] COV-T001 `spec.md` 작성
- [x] COV-T002 `plan.md` 작성
- [x] COV-T003 `tasks.md` 작성

## Phase 2: Coverage Runtime

- [x] COV-T004 `@vitest/coverage-v8` devDependency 추가
- [x] COV-T005 web/storybook `test:coverage` 스크립트 추가

## Phase 3: Workflow Integration

- [x] COV-T006 `web-ci.yml`에 coverage 실행 단계 추가
- [x] COV-T007 `design-system-ci.yml`에 coverage 실행 단계 추가
- [x] COV-T008 coverage summary(Job Summary) 출력 단계 추가
- [x] COV-T009 coverage artifact 업로드 단계 추가
- [x] COV-T012 Telegram coverage 알림 단계 추가(web/design-system)

## Phase 4: Verification

- [x] COV-T010 로컬 coverage 실행 검증(web/storybook)
- [x] COV-T011 변경 파일 diff/self-review
- [x] COV-T013 Telegram 알림 단계 조건식/시크릿 fallback 검증

## Post-Implementation Validation (GitHub Runtime)

- [ ] Coverage metrics are visible in PR job summaries.
- [ ] Coverage artifacts can be downloaded from workflow runs.
- [ ] Existing web/design-system CI checks still pass in GitHub Actions.
- [ ] Coverage Telegram notification is delivered when secrets are configured.
