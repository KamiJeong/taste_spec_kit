Tech-Stack: specs/00-tech-stack.md

# Tasks: Storybook + shadcn/ui Component Ownership

**Input**: Design documents from `/specs/01-storybook-shadcn-forms/`  
**Prerequisites**: `spec.md`, `plan.md`

## Review (Tasks Step)

### 검토 결과

1. 설치 방식이 태스크로 분리되지 않아 실제 실행 시 누락되기 쉬웠다.
2. CLI 실행 증거와 실패 처리(EACCES) 규칙이 태스크에 없었다.

### Refine 결정

1. 설치 표준화 단계(Init/Add/Evidence)를 Phase 2로 고정한다.
2. ownership과 story 구현은 설치 완료 후 진행한다.

## Format: `[ID] [P?] [Story] Description`

- `[P]`: 병렬 가능
- `[Story]`: US 매핑

## Phase 1: Bootstrap (Shared)

- [x] T001 Create root workspace files: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`
- [x] T002 Create `apps/storybook` skeleton: `.storybook`, `src/stories`, `src/tests`, `src/_shared`
- [x] T003 Create `packages/ui` skeleton: `src/components/ui`, `src/lib`, `components.json`

---

## Phase 2: shadcn/ui Install Standardization (P1)

- [x] T004 [US1] Run `pnpm dlx shadcn@latest init --cwd packages/ui` (already initialized: `components.json` exists)
- [x] T005 [US1] Run `pnpm dlx shadcn@latest add button input select checkbox radio-group dialog form label --cwd packages/ui`
- [x] T006 [US1] Verify generated files under `packages/ui/src/components/ui/*`
- [x] T007 [US1] Update `packages/ui/src/index.ts` exports for newly added components
- [x] T008 [US1] Record install logs/failures(EACCES 포함) in `specs/01-storybook-shadcn-forms/README-setup.md`

---

## Phase 3: User Story 1 - UI Source Ownership (P1)

- [x] T009 [US1] Enforce UI source-only path: `packages/ui/src/components/ui/`
- [x] T010 [US1] Ensure no reusable UI implementation files exist under `apps/storybook/src`
- [x] T011 [US1] Add ownership guard test: `apps/storybook/src/tests/ui-ownership-guard.test.ts`

---

## Phase 4: User Story 2 - Storybook Consumer Layer (P1)

- [x] T012 [P] [US2] Add component stories in `apps/storybook/src/stories/components/*.stories.tsx`
- [x] T013 [P] [US2] Add form stories/docs in `apps/storybook/src/stories/forms/*` and `apps/storybook/src/stories/docs/*`
- [x] T014 [US2] Enforce `@repo/ui` imports for interactive UI in story files

---

## Phase 5: User Story 3 - Ownership Governance (P2)

- [x] T015 [US3] Create catalog doc: `specs/01-storybook-shadcn-forms/shadcn-component-catalog.md`
- [x] T016 [US3] Add component-to-story mapping in catalog doc
- [x] T017 [US3] Update workflow doc in `specs/01-storybook-shadcn-forms/README-setup.md` (`shadcn add -> export -> story`)

---

## Phase 6: Verification

- [x] T018 Run `pnpm install`
- [x] T019 Run `pnpm typecheck`
- [x] T020 Run `pnpm test`
- [x] T021 Run `pnpm build-storybook`
- [x] T022 Record gate outputs in `specs/01-storybook-shadcn-forms/README-setup.md`

---

## Dependencies & Execution Order

- Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6
- Priority: US1 -> US2 -> US3
