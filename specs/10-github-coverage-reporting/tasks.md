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

## Phase 4: Verification

- [x] COV-T010 로컬 coverage 실행 검증(web/storybook)
- [x] COV-T011 변경 파일 diff/self-review

## Done Checklist

- [ ] PR에서 coverage 수치가 보인다.
- [ ] coverage artifact 다운로드가 가능하다.
- [ ] 기존 web/design-system CI 동작을 깨지 않는다.
