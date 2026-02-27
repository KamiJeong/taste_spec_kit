Tech-Stack: specs/00-tech-stack.md

# Tasks: Design System Foundation + shadcn/ui Ownership

**Input**: Design documents from `/specs/01-design-system/`  
**Prerequisites**: `spec.md`, `plan.md`

## Review (Tasks Step)

### 검토 결과

1. 설치/구현 태스크는 완료되었지만 실행 후 품질 이슈(focus-visible, calendar styling)가 별도 기록되지 않았다.
2. 재생성(runbook) 관점 태스크가 부족해 차후 동일 결과 재현성이 낮았다.
3. 테마 확장을 위한 후속 Review/Refine 단계가 정의되지 않았다.

### Refine 결정

1. 구현 완료 이후 안정화 태스크(포커스/캘린더)를 완료 처리로 추가한다.
2. 재생성 절차를 별도 Phase로 고정해 명령/검증 체크포인트를 남긴다.
3. 테마 준비 Review/Refine를 마지막 Phase로 추가한다.

## Format: `[ID] [P?] [Story] Description`

- `[P]`: 병렬 가능
- `[Story]`: US 매핑

## Phase 1: Bootstrap (Shared)

- [x] T001 Create root workspace files: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`
- [x] T002 Create `apps/storybook` skeleton: `.storybook`, `src/stories`, `src/tests`, `src/_shared`
- [x] T003 Create `packages/ui` skeleton: `src/components/ui`, `src/lib`, `components.json`

---

## Phase 2: shadcn/ui Install Standardization (P1)

- [x] T004 [US1] Run `pnpm dlx shadcn@latest init --cwd packages/ui`
- [x] T005 [US1] Run `pnpm dlx shadcn@latest add button input select checkbox radio-group dialog form label --cwd packages/ui`
- [x] T006 [US1] Verify generated files under `packages/ui/src/components/ui/*`
- [x] T007 [US1] Update `packages/ui/src/index.ts` exports for newly added components
- [x] T008 [US1] Record install logs/failures(EACCES 포함) in `specs/01-design-system/README-setup.md`

---

## Phase 2.5: shadcn MCP Setup Standardization (P1)

- [x] T023 [US1] Add shadcn MCP reference link to `specs/01-design-system/README-setup.md` (`https://ui.shadcn.com/docs/mcp?utm_source=chatgpt.com`)
- [x] T024 [US1] Define MCP usage rule in setup doc: generation target is `packages/ui` only, Storybook is consumer-only
- [x] T025 [US1] Add MCP troubleshooting/logging section in setup doc (connection/permission/retry)
- [x] T026 [US1] Cross-check wording sync across `spec.md`, `plan.md`, `tasks.md` for FR-010~FR-012

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

- [x] T015 [US3] Create catalog doc: `specs/01-design-system/shadcn-component-catalog.md`
- [x] T016 [US3] Add component-to-story mapping in catalog doc
- [x] T017 [US3] Update workflow doc in `specs/01-design-system/README-setup.md` (`shadcn add -> export -> story`)

---

## Phase 6: Verification

- [x] T018 Run `pnpm install`
- [x] T019 Run `pnpm typecheck`
- [x] T020 Run `pnpm test`
- [x] T021 Run `pnpm build-storybook`
- [x] T022 Record gate outputs in `specs/01-design-system/README-setup.md`

---

## Phase 7: Post-Implementation Refinement (P1)

- [x] T027 [US2] Fix focus-visible default outline regression in `input`, `textarea`, `select`
- [x] T028 [US2] Fix `calendar` Tailwind class compatibility for Storybook styling
- [x] T029 [US2] Keep visual status marker(`completed` / `in-progress`) in component stories
- [x] T030 [US3] Update `spec.md`, `plan.md`, `tasks.md`, `README-setup.md` with reproducible regeneration notes

---

## Phase 8: Theme Readiness Review/Refine (P2)

- [x] T031 [US3] Define "token-first theming" rule in docs (minimize per-component class churn)
- [x] T032 [US3] Add theme-change regression checklist (`typecheck`, `test`, `build-storybook`)
- [x] T033 [US3] Record known risk points for theme work (ring contrast, calendar states, toast/sonner consistency)
- [x] T034 [US3] Lock Theme T1 decisions (`light/dark/brand/brand-dark`, Tailwind v3 hold, accessibility baseline)
- [x] T035 [US3] Add token mapping baseline doc: `specs/01-design-system/theme-token-map.md`
- [x] T036 [US2] Add Storybook global theme toolbar wiring in `.storybook/preview.ts`
- [x] T037 [US3] Add semantic alias tokens in `packages/ui/src/styles/styles.css` (`--focus-ring`, `--calendar-*`, `--toast-*`)
- [x] T038 [US2] Add multi-theme snapshot stories for `Input`, `Select`, `Calendar`, `Sonner`

---

## Dependencies & Execution Order

- Phase 1 -> Phase 2 -> Phase 2.5 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7 -> Phase 8
- Priority: US1 -> US2 -> US3



