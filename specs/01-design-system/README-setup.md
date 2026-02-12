Tech-Stack: specs/00-tech-stack.md

# Setup Guide: 01-design-system

## Install Workflow (Standard)

1. `pnpm dlx shadcn@latest init --cwd packages/ui`
2. `pnpm dlx shadcn@latest add <component> --cwd packages/ui`
3. Export from `packages/ui/src/index.ts`
4. Consume via `@repo/ui` in `apps/storybook/src/stories`

## MCP Setup Reference

- Reference: `https://ui.shadcn.com/docs/mcp?utm_source=chatgpt.com`
- MCP-based generation must keep ownership boundary:
  - generation target: `packages/ui` only
  - storybook role: consumer-only (`@repo/ui` import)

## Install Execution Note

- Execution date: 2026-02-12
- `pnpm dlx shadcn@latest init --cwd packages/ui --yes`: FAIL (framework detection at library package)
- Fallback: manual `components.json` + tsconfig alias configuration in `packages/ui`
- `pnpm dlx shadcn@latest add ... --cwd packages/ui --yes`:
  - First attempt included `toast` and failed (`toast` deprecated notice)
  - Second attempt excluding `toast` succeeded and generated registry components
- Remaining requested items not in direct registry flow were implemented as custom wrappers/composites:
  - `button-group`, `combobox`, `data-table`, `date-picker`, `direction`, `empty`, `field`, `input-group`, `item`, `kbd`, `native-select`, `spinner`, `toast`, `typography`

## MCP Troubleshooting / Logging

- Connection failure:
  - Symptom: MCP tool cannot fetch registry metadata or generate components.
  - Action: verify network access and retry with the same `packages/ui` target.
- Permission failure:
  - Symptom: write errors during generation.
  - Action: check workspace write permissions and retry without changing ownership paths.
- Retry rule:
  - Always retry with the same install flow (`init -> add -> export -> story`) and keep logs in this file.

## Quality Gates

- `pnpm install`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build-storybook`

## Quality Gate Results

- `pnpm install`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: PASS
- `pnpm build-storybook`: PASS
- Note: Storybook build emits non-blocking warnings (`"use client" directive ignored`, large chunks).

## Post-Implementation Fix Log (2026-02-12)

- Focus-visible refinement:
  - Updated `packages/ui/src/components/ui/input.tsx`
  - Updated `packages/ui/src/components/ui/textarea.tsx`
  - Updated `packages/ui/src/components/ui/select.tsx`
  - Result: browser default focus outline 제거, 디자인 시스템 ring 스타일로 통일
- Calendar styling refinement:
  - Updated `packages/ui/src/components/ui/calendar.tsx`
  - Tailwind v3 호환 문법으로 클래스 변환 (`size-[--cell-size]`, `h-[--cell-size]`, `w-[--cell-size]`, `px-[--cell-size]`, `min-w-[--cell-size]`)
  - Result: Storybook에서 calendar 디자인 적용 정상화

## Regeneration Runbook (From Clean State)

1. Install workspace dependencies
   - `pnpm install`
2. Initialize shadcn context in `packages/ui` (fallback 허용)
   - `pnpm dlx shadcn@latest init --cwd packages/ui --yes`
   - 실패 시 `components.json`/alias를 수동 유지하고 다음 단계 진행
3. Add shadcn components to `packages/ui`
   - `pnpm dlx shadcn@latest add <component...> --cwd packages/ui --yes`
4. Export added components from `packages/ui/src/index.ts`
5. Create/maintain stories in `apps/storybook/src/stories` via `@repo/ui` imports only
6. Verify ownership and quality gates
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build-storybook`
7. Record execution/failure logs in this file

## Theme Readiness (Review/Refine)

- Rule 1: theme 작업은 token-first(`styles.css` 변수 레이어 우선)로 진행
- Rule 2: 컴포넌트 클래스 변경은 token만으로 해결되지 않는 경우에만 수행
- Rule 3: 테마 변경마다 아래 회귀 항목 확인
  - `focus-visible` ring 대비(특히 `input/textarea/select`)
  - `calendar` 상태 색상(today/range/disabled/outside)
  - `sonner/toast` 알림 톤 일관성
  - `pnpm typecheck`, `pnpm test`, `pnpm build-storybook` 재실행

## Storybook Theme Controls

- Global toolbar: `light`, `dark`, `brand`, `brand-dark`
- 적용 위치: `apps/storybook/.storybook/preview.ts`
- 토큰 기준: `packages/ui/src/styles/styles.css` + `specs/01-design-system/theme-token-map.md`
- 핵심 테마 스냅샷 스토리:
  - `apps/storybook/src/stories/components/Input.stories.tsx`
  - `apps/storybook/src/stories/components/Select.stories.tsx`
  - `apps/storybook/src/stories/components/Calendar.stories.tsx`
  - `apps/storybook/src/stories/components/Sonner.stories.tsx`

## Ownership Checklist

- [x] `apps/storybook/src`에 UI 구현 파일 없음
- [x] story 파일에서 인터랙티브 UI는 `@repo/ui` import 사용
- [x] `packages/ui/src/components/ui`와 `shadcn-component-catalog.md` 매핑 일치
