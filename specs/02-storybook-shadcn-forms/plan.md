Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Storybook shadcn/ui + react-hook-form + Layout Stories

**Branch**: `02-storybook-shadcn-forms` | **Date**: 2026-02-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/02-storybook-shadcn-forms/spec.md`

**Note**: This document follows `/speckit.plan` workflow and explicitly references `specs/00-tech-stack.md` as SSOT.

## Summary

`spec.md` 요구사항(FR-001~FR-008)을 기준으로 Storybook 문서/스토리 체계를 설계한다.  
핵심 범위는 다음 4가지다.

1. shadcn/ui 컴포넌트 스토리(Button, Input, Select, Checkbox/Radio, Modal)
2. react-hook-form 연동 스토리(Controller + register, 동기/비동기 검증, submit/reset)
3. 레이아웃 프리미티브(Container/Grid/Stack)와 반응형 스토리
4. a11y 점검 및 테스트 가이드(시각 회귀/단위 테스트 예시)

## Technical Context

**Language/Version**: TypeScript ^5.7.0, Node.js 22.x LTS  
**Primary Dependencies**: React ^19.0.0, Storybook ^8.5.0, shadcn/ui (latest), react-hook-form ^7.54.0, Zod ^3.24.0, Tailwind CSS ^4.0.0  
**Storage**: N/A (UI 스토리 문서화 기능)  
**Testing**: Storybook a11y addon, Playwright ^1.49.0(가이드/통합), Vitest ^2.1.0(선택)  
**Target Platform**: 로컬 개발 환경 + 최신 데스크톱/모바일 브라우저  
**Project Type**: 문서/스펙 중심 monorepo (현재 코드 앱 디렉터리 미생성 상태)  
**Performance Goals**: Storybook 스토리 최초 로드 체감 3초 이내(개발 환경 기준)  
**Constraints**: TypeScript 오류 0건, 주요 스토리 a11y 치명 위반 0건, 복붙 가능한 코드 예시 제공  
**Scale/Scope**: 컴포넌트 스토리 세트 + 폼 스토리 세트 + 레이아웃 스토리 세트 + 가이드 문서

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **SSOT**: 기술 기준은 `specs/00-tech-stack.md`, 기능 기준은 `specs/02-storybook-shadcn-forms/spec.md`를 단일 출처로 사용
- [x] **Overrides-Only**: Storybook 기본 설정을 유지하고, feature 요구사항에 필요한 스토리/애드온만 추가
- [x] **Pinned-Stack**: 계획에서 사용하는 의존성은 `specs/00-tech-stack.md` 버전 범위를 따름
- [x] **Local-First**: 네트워크 없이도 스토리 렌더/검증 가능한 구조를 우선(비동기 검증은 mock 기반)
- [x] **Cost-Aware**: 기본안은 로컬/오픈소스 도구 우선, Chromatic은 선택 옵션으로 분리
- [x] **Boundaries**: 컴포넌트 스토리, 폼 스토리, 레이아웃 스토리, 문서 스토리를 분리
- [x] **Type-Safety**: TS strict 전제, RHF/Zod 타입 기반 스토리 예시 적용
- [x] **Spec-Before-Code**: 본 계획은 `spec.md` 기준으로 작성

위반 사항 없음.

## Project Structure

### Documentation (this feature)

```text
specs/02-storybook-shadcn-forms/
├── spec.md
├── plan.md
├── tasks.md
├── resolve-ui.md
└── README-setup.md
```

### Source Code (repository root)

```text
.specify/
├── templates/
└── scripts/

specs/
├── 00-tech-stack.md
├── 01-email-auth-user-management/
└── 02-storybook-shadcn-forms/
```

**Structure Decision**: 현재 저장소는 구현 코드보다 Spec Kit 산출물 관리가 중심이므로, 이번 단계는 `specs/02-storybook-shadcn-forms/` 문서 완결성 강화에 초점을 둔다. 실제 Storybook 코드 경로(`apps/*`, `packages/*`)는 저장소에 생성되는 시점에 `tasks.md`에서 확정한다.

## Phase Plan

### Phase 0 - Research & Decision Closure

1. `RQ1` 해소: `shadcn/ui`는 로컬 벤더링(`packages/ui`) 방식으로 확정 (2026-02-10)
2. `RQ2` 해소: 시각 회귀는 OSS 스냅샷 기반으로 확정, Chromatic은 비기본 옵션으로 유지 (2026-02-10)
3. 비동기 검증 mock 전략(MSW 또는 Storybook play 기반) 확정

### Phase 1 - Design Artifacts

1. 스토리 카테고리 맵 설계(기본 컴포넌트/폼/레이아웃/문서)
2. RHF 예시 표준안(Controller/register, 에러 메시지 패턴, reset 흐름) 정의
3. 반응형 레이아웃 기준(뷰포트, 컬럼 규칙, 문서 표기법) 정의
4. a11y 점검 기준과 테스트 시나리오(critical 위반 차단) 정의

### Phase 2 - Task Decomposition Input

`/speckit.tasks` 생성에 필요한 구현 단위를 다음으로 분리한다.

1. Storybook 기반 설정/검증
2. 컴포넌트 스토리 구현
3. 폼 스토리 구현
4. 레이아웃 스토리 구현
5. 문서(MDX/Controls code panel) 보강
6. a11y/테스트 자동화 연결

## Deliverables for This Plan Stage

1. `/speckit.plan` 형식의 `plan.md` 정합성 확보
2. 헌법 8원칙 기반 게이트 체크 통과 기록
3. 의사결정 게이트(RQ1/RQ2)와 후속 태스크 분해 기준 명시

## Decision Log

- **RQ1 (UI source)**: `packages/ui` 로컬 벤더링 채택
- **RQ2 (visual regression)**: OSS 스냅샷 테스트 채택, Chromatic은 선택적 보조안

## Implementation Progress (2026-02-10)

- Setup/Foundation completed (`T001`~`T010`)
- US1 completed (`T011`~`T016`)
- US2 completed (`T017`~`T022`)
- US3/US4 implementation and tests added (`T023`~`T032`)
- Quality gate completed (`T033`): `pnpm typecheck`, `pnpm test`, `pnpm build-storybook` passed

## Complexity Tracking

해당 없음 (헌법 위반 없음).
