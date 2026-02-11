Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Storybook + shadcn/ui Component Ownership

**Branch**: `01-storybook-shadcn-forms` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-storybook-shadcn-forms/spec.md`

## Review (Plan Step)

### 검토 결과

1. 현재 저장소에는 구현 코드가 제거되어 재부트스트랩이 필요하다.
2. 이번 라운드의 핵심은 기능 추가보다 구조 경계 강제다.

### Refine 방향

1. `packages/ui`를 컴포넌트 단일 소스로 재구성
2. `apps/storybook`을 스토리 소비 계층으로 제한
3. 카탈로그/가드 테스트를 품질 게이트에 포함
4. shadcn/ui 설치 절차를 CLI 기준으로 표준화하고 증거 수집 규칙을 추가

## Summary

`FR-001~FR-009` 기준으로 monorepo를 재구성한다. 구현 우선순위는 `(1) 설치 표준화 -> (2) ownership 경계 확립 -> (3) Storybook 소비 구조 -> (4) guard/문서화`다.

## Technical Context

**Language/Version**: TypeScript ^5.7.0, Node.js 22.x LTS  
**Primary Dependencies**: Storybook ^10.2.x, React ^19.0.0, shadcn/ui registry latest (CLI workflow), Tailwind CSS ^4.0.0  
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
specs/01-storybook-shadcn-forms/
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

### Phase 1 - Bootstrap

1. 루트 workspace 파일 복원
2. `packages/ui`, `apps/storybook` 최소 구조 복원

### Phase 1.5 - shadcn Install Standardization

1. `pnpm dlx shadcn@latest init --cwd packages/ui` 실행
2. 대표 컴포넌트 `add` 명령 실행(예: button/input/select)
3. 생성 파일과 export 경로 검증
4. 실패 시(EACCES/네트워크) 원인 및 재시도 정책 문서화

### Phase 2 - Ownership Baseline

1. `packages/ui`에 shadcn config 및 기본 컴포넌트 배치
2. `apps/storybook`은 story/docs/tests만 배치
3. story에서 `@repo/ui` import 규칙 적용

### Phase 3 - Governance

1. `shadcn-component-catalog.md` 작성
2. `ui-ownership-guard.test.ts` 추가
3. setup 문서에 컴포넌트 추가 절차 고정

### Phase 4 - Verification

1. `pnpm install`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build-storybook`

## Deliverables

1. ownership 중심 spec/plan/tasks 정합성
2. component catalog + guard test
3. 품질 게이트 실행 로그
