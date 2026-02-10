Tech-Stack: specs/00-tech-stack.md

# Tasks: Storybook shadcn/ui + react-hook-form + Layout Stories

**Input**: Design documents from `/specs/02-storybook-shadcn-forms/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required)

**Tests**: This feature explicitly requires test examples and a11y checks (FR-005, FR-008), so test tasks are included.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- `[P]`: Can run in parallel (different files, no direct dependency)
- `[Story]`: User story mapping (`US1`, `US2`, `US3`, `US4`)
- All tasks include concrete paths

## Path Conventions

- Storybook app root: `apps/storybook/`
- Story files: `apps/storybook/src/stories/`
- Docs story files: `apps/storybook/src/stories/docs/`
- Test files: `apps/storybook/src/tests/`
- Feature docs: `specs/02-storybook-shadcn-forms/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Storybook runtime and baseline tooling setup.

- [x] T001 Create Storybook workspace skeleton in `apps/storybook/package.json`, `apps/storybook/tsconfig.json`, `apps/storybook/.storybook/main.ts`, `apps/storybook/.storybook/preview.ts`
- [x] T002 Configure Storybook addons (`essentials`, `a11y`) in `apps/storybook/.storybook/main.ts`
- [x] T003 [P] Add TypeScript strict config and alias mapping in `apps/storybook/tsconfig.json`
- [x] T004 [P] Add shared style/bootstrap entry in `apps/storybook/src/styles.css` and import from `apps/storybook/.storybook/preview.ts`
- [x] T005 Document setup and run commands in `specs/02-storybook-shadcn-forms/README-setup.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Decisions and foundations required before user-story implementation.

**CRITICAL**: No US tasks start before this phase is done.

- [x] T006 Resolve RQ1 (`packages/ui` vs external dependency) and record decision in `specs/02-storybook-shadcn-forms/resolve-ui.md`
- [x] T007 Resolve RQ2 (Chromatic vs OSS snapshot) and record decision in `specs/02-storybook-shadcn-forms/plan.md`
- [x] T008 Create shared story helper wrappers in `apps/storybook/src/stories/_shared/decorators.tsx`
- [x] T009 [P] Create shared form fixtures and validators in `apps/storybook/src/stories/_shared/form-fixtures.ts`
- [x] T010 [P] Create viewport/breakpoint constants in `apps/storybook/src/stories/_shared/breakpoints.ts`

**Checkpoint**: Foundation ready; US1/US2/US3/US4 can proceed.

---

## Phase 3: User Story 1 - 컴포넌트 탐색 및 학습 (Priority: P1) 🎯 MVP

**Goal**: 주요 UI 컴포넌트 변형/상태/코드 예시를 Storybook에서 즉시 확인 가능하게 한다.

**Independent Test**: Button/Input/Select/Choice 스토리에서 variant/state/controls/code panel 확인.

### Tests for User Story 1

- [x] T011 [P] [US1] Add smoke interaction tests for component stories in `apps/storybook/src/tests/us1-component-stories.test.tsx`

### Implementation for User Story 1

- [x] T012 [P] [US1] Implement button stories in `apps/storybook/src/stories/components/Button.stories.tsx`
- [x] T013 [P] [US1] Implement input stories (register + controller samples) in `apps/storybook/src/stories/components/Input.stories.tsx`
- [x] T014 [P] [US1] Implement select stories (single/multi/options) in `apps/storybook/src/stories/components/Select.stories.tsx`
- [x] T015 [P] [US1] Implement checkbox/radio stories in `apps/storybook/src/stories/components/Choice.stories.tsx`
- [x] T016 [US1] Add code-panel snippets and args docs for US1 stories in `apps/storybook/src/stories/components/*.stories.tsx`

**Checkpoint**: US1 independently usable.

---

## Phase 4: User Story 2 - RHF 폼 시나리오 (Priority: P1)

**Goal**: RHF Controller/register, 동기/비동기 검증, submit/reset 흐름을 명확히 제공한다.

**Independent Test**: 폼 스토리에서 required/pattern/async 검증, submit/reset 동작 확인.

### Tests for User Story 2

- [x] T017 [P] [US2] Add RHF validation tests in `apps/storybook/src/tests/us2-rhf-validation.test.tsx`
- [x] T018 [P] [US2] Add async validation mock tests in `apps/storybook/src/tests/us2-rhf-async.test.tsx`

### Implementation for User Story 2

- [x] T019 [P] [US2] Implement composed RHF form stories in `apps/storybook/src/stories/forms/ComposedForm.stories.tsx`
- [x] T020 [P] [US2] Implement dialog-embedded form story in `apps/storybook/src/stories/forms/FormInDialog.stories.tsx`
- [x] T021 [US2] Implement async validation mock handlers in `apps/storybook/src/stories/forms/mocks/handlers.ts`
- [x] T022 [US2] Document controller vs register usage in `apps/storybook/src/stories/docs/RHF-Guide.mdx`

**Checkpoint**: US2 independently usable.

---

## Phase 5: User Story 3 - 반응형 레이아웃 검증 (Priority: P2)

**Goal**: Container/Grid/Stack 및 뷰포트별 반응형 패턴을 검증 가능하게 한다.

**Independent Test**: mobile/tablet/desktop 전환 시 컬럼/스택 동작이 문서와 일치.

### Tests for User Story 3

- [x] T023 [P] [US3] Add viewport regression checklist tests in `apps/storybook/src/tests/us3-layout-viewport.test.tsx`

### Implementation for User Story 3

- [x] T024 [P] [US3] Implement container/grid/stack stories in `apps/storybook/src/stories/layouts/LayoutPrimitives.stories.tsx`
- [x] T025 [P] [US3] Implement auth-form and dashboard-grid layout scenarios in `apps/storybook/src/stories/layouts/LayoutScenarios.stories.tsx`
- [x] T026 [US3] Add breakpoint behavior documentation in `apps/storybook/src/stories/docs/Layout-Guide.mdx`

**Checkpoint**: US3 independently usable.

---

## Phase 6: User Story 4 - a11y 및 테스트 검증 (Priority: P1)

**Goal**: 주요 스토리에 대해 치명적 a11y 위반 0 기준을 검증 가능한 상태로 만든다.

**Independent Test**: a11y addon + 자동 테스트로 Button/Input/Form/Modal 주요 케이스 검증.

### Tests for User Story 4

- [x] T027 [P] [US4] Add a11y assertions for critical stories in `apps/storybook/src/tests/us4-a11y-critical.test.tsx`
- [x] T028 [P] [US4] Add visual regression example test in `apps/storybook/src/tests/us4-visual-regression.test.ts`

### Implementation for User Story 4

- [x] T029 [US4] Add a11y parameters and keyboard notes to core stories in `apps/storybook/src/stories/components/*.stories.tsx` and `apps/storybook/src/stories/forms/*.stories.tsx`
- [x] T030 [US4] Add CI test run guide in `specs/02-storybook-shadcn-forms/README-setup.md`
- [x] T031 [US4] Record acceptance evidence checklist in `specs/02-storybook-shadcn-forms/tasks.md` (this file)

**Checkpoint**: US4 independently usable.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Final consistency, docs, and release readiness.

- [x] T032 [P] Normalize story naming/export style across `apps/storybook/src/stories/**/*.stories.tsx`
- [x] T033 [P] Run full quality gate (`storybook build`, tests, type-check) and capture results in `specs/02-storybook-shadcn-forms/README-setup.md`
- [x] T034 Update final delivery notes and open items in `specs/02-storybook-shadcn-forms/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1: no dependencies
- Phase 2: depends on Phase 1 and blocks all US phases
- Phase 3/4/5/6: depend on Phase 2 completion
- Phase 7: depends on all targeted US phases completion

### User Story Dependencies

- US1: starts right after Phase 2
- US2: starts right after Phase 2 (independent from US1)
- US3: starts right after Phase 2 (independent from US1/US2)
- US4: starts right after Phase 2 but should consume artifacts from US1/US2 stories

### Within Each User Story

- Tests first and failing before implementation
- Shared fixtures/utilities before story-specific wiring
- Story implementation before docs polish

## Parallel Opportunities

- `T003`, `T004`, `T005` can run together
- `T009`, `T010` can run together
- In US1: `T012`~`T015` parallel
- In US2: `T017`, `T018`, `T019`, `T020` parallel (after fixtures ready)
- In US3: `T024`, `T025` parallel
- In US4: `T027`, `T028` parallel

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2
2. Complete US1 (Phase 3) as MVP
3. Validate US1 independently

### Incremental Delivery

1. Add US2 for RHF depth
2. Add US3 for responsive layout validation
3. Add US4 for a11y and test gates
4. Finish with Phase 7 polish

### Parallel Team Strategy

1. One engineer: Phase 1/2 ownership
2. After foundation:
3. Engineer A -> US1
4. Engineer B -> US2
5. Engineer C -> US3/US4

## Acceptance Evidence Checklist (T031)

- [x] US1 component stories added with docs/code snippets
- [x] US2 RHF composed form + dialog form stories added
- [x] US3 layout primitives/scenarios and layout guide added
- [x] US4 a11y baseline test and visual snapshot tests added
- [x] Full quality gate executed and logged (`T033`)
