Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Design System Foundation + shadcn/ui Ownership

**Branch**: `feature/01-design-system` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-design-system/spec.md`

## Review (Plan Step)

### 검토 결과

1. 초기 재부트스트랩은 완료되었고, 현재는 구현 안정화/회귀 방지가 핵심이다.
2. 구조 경계(`packages/ui` 소유, `apps/storybook` 소비)는 유지된 상태다.

### Refine 방향

1. 실행 이력(설치 실패/재시도/검증)을 문서에 고정한다.
2. UI 동작 품질 이슈(포커스 링, 캘린더 스타일)를 회귀 항목으로 추가한다.
3. 차기 테마 작업을 위해 토큰 우선 변경 원칙을 명시한다.

## Review (Execution Sync Step)

### 검토 결과 (2026-02-12)

1. 구현이 완료된 현재 상태와 계획 문서의 "재시작 전제"가 불일치한다.
2. 실제 실행된 수정(포커스-visible, 캘린더 Tailwind 호환)이 phase에 드러나지 않는다.

### Refine 방향 (Restart Sync)

1. 계획을 "완료된 실행 기록 + 재생성 절차 + 차기 테마 준비" 구조로 전환한다.
2. 검증 단계에 `typecheck/test/build-storybook` 반복 기준을 유지한다.

## Summary

`FR-001~FR-016` 기준으로 구현을 완료했고, 현재 계획은 `(1) 실행 이력 고정 -> (2) 재생성 런북 확정 -> (3) Review/Refine(테마 준비) -> (4) 회귀 검증 반복`이다.

## Traceability Strategy

1. FR coverage
- FR-001~FR-004: 소유 경계 + Storybook 소비 경계는 Phase 2~4에서 유지/검증한다.
- FR-005~FR-007: 카탈로그/guard/workflow 문서는 Phase 3~5에서 고정한다.
- FR-008~FR-012: CLI/MCP 설치 규칙은 Phase 2/2.5와 setup 문서로 추적한다.
- FR-013~FR-016: UI 품질/상태 표기는 Phase 4/7/8에서 회귀 점검한다.

2. SC coverage
- SC-001: 문서 동기화 검토를 각 Refine Step에서 강제한다.
- SC-002~SC-004: 산출물(카탈로그, guard, setup) 존재와 내용을 확인한다.
- SC-005~SC-007: 실행 로그, 스타일 회귀, 상태 배지 검증을 Phase 5~8 게이트로 반복한다.

## Technical Context

**Language/Version**: TypeScript ^5.7.0, Node.js 22.x LTS  
**Primary Dependencies**: Storybook ^10.2.x, React ^19.0.0, shadcn/ui registry latest (CLI workflow), shadcn MCP docs, Tailwind CSS ^3.4.17  
**Storage**: N/A  
**Testing**: Vitest + ownership guard test  
**Target Platform**: local-first monorepo  
**Project Type**: `apps/storybook` + `packages/ui`  
**Constraints**: UI 구현은 `packages/ui` only, storybook은 story/docs/tests only  
**Scale/Scope**: ownership 강제와 문서 정합성 우선

## Constitution Check

- [x] **SSOT**: `specs/00-tech-stack.md` 참조
- [x] **Boundaries**: `packages/ui`와 `apps/storybook` 책임 분리
- [x] **Spec-Before-Code**: 본 계획은 재정의된 spec 기반
- [x] **Type-Safety**: TS strict 기반 구성 유지
- [x] **Local-First**: 외부 의존 최소화, 로컬 검증 루틴 우선

## Project Structure

### Documentation

```text
specs/01-design-system/
├── spec.md
├── plan.md
├── tasks.md
├── README-setup.md
└── shadcn-component-catalog.md (new)
```

### Source Code

```text
apps/
└── storybook/
    └── src/
        ├── stories/
        ├── tests/
        └── _shared/

packages/
└── ui/
    └── src/
        ├── components/ui/
        └── lib/
```

## Phase Plan

### Phase 1 - Bootstrap (Completed)

1. 루트 workspace 및 앱/패키지 골격 복원
2. Storybook/UI 패키지 최소 실행 단위 확보

### Phase 2 - Install + MCP Standardization (Completed)

1. `init` 실패 케이스를 문서화하고 수동 fallback 경로 확정
2. `add` 기반 registry 컴포넌트 생성 및 export 정합성 확보
3. MCP 참조/장애 대응/로그 규칙을 setup에 반영

### Phase 3 - Ownership + Story Coverage (Completed)

1. 컴포넌트 구현은 `packages/ui` 단일 경로로 고정
2. Storybook은 `@repo/ui` 소비 계층으로 정리
3. 컴포넌트 카탈로그와 ownership guard 테스트 반영

### Phase 4 - UI Quality Refinement (Completed)

1. 입력 계열 focus-visible outline 회귀 수정
2. Calendar Tailwind v3 호환 클래스 정리
3. Storybook 구현 상태 시각 표기(완료/진행중) 유지

### Phase 5 - Verification + Regeneration (Completed)

1. `pnpm typecheck`, `pnpm test`, `pnpm build-storybook` 통과
2. setup 문서에 설치/실패/재시도/게이트 결과 기록
3. 재생성 런북 기준(install -> add -> export -> story -> gates) 고정

### Phase 6 - Theme Readiness (Review/Refine)

1. 테마 변경은 토큰 레이어 우선 변경 원칙 적용
2. 컴포넌트 클래스 변경은 토큰으로 해결 불가한 경우로 제한
3. 테마 변경마다 품질 게이트 3종(typecheck/test/build-storybook) 반복

## Deliverables

1. ownership 중심 spec/plan/tasks 정합성
2. component catalog + guard test
3. 품질 게이트 실행 로그
4. shadcn MCP 설정/운영 기준 문서화
5. theme-plan + theme-token-map + Storybook theme toolbar 기준
