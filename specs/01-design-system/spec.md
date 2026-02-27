Tech-Stack: specs/00-tech-stack.md

# 기능 명세: Design System Foundation + shadcn/ui Ownership

**Feature Branch**: `01-design-system`  
**Created**: 2026-02-11  
**Status**: Implemented (Reviewed/Refined, 2026-02-12)  
**Input**: User description: "spec > plan > tasks를 재시작하고, shadcn/ui 컴포넌트는 packages/ui에만 두고 story는 apps/storybook에만 둔다"

## Review (Install Method Step)

### 설치 방식 검토 결과 (2026-02-11)

1. `shadcn` CLI의 최신 권장 흐름은 `create`(신규 프로젝트) 또는 `init` + `add`(기존 프로젝트)다.
2. 본 저장소는 기존 monorepo 정렬이 목적이므로 `create`가 아니라 `init` + `add`를 사용해야 한다.
3. 소유 경계를 고정하려면 `add`의 대상 경로를 `packages/ui`로 강제하고, 생성 결과 검증(파일/로그)을 남겨야 한다.

### Refine 결정 (Install)

1. 설치 표준 명령은 `pnpm dlx shadcn@latest init --cwd packages/ui`로 고정한다.
2. 컴포넌트 추가 표준 명령은 `pnpm dlx shadcn@latest add <component> --cwd packages/ui`로 고정한다.
3. 설치 증거는 실행 로그 + 생성 파일(`components.json`, `src/components/ui/*`) + export 반영으로 정의한다.

## Review (MCP Setup Step)

### MCP 설정 검토 결과 (2026-02-12)

1. `specs/00-tech-stack.md`가 shadcn/ui MCP 가이드를 공식 참조로 채택했다.
2. Codex/LLM 기반 컴포넌트 워크플로우는 MCP 연결 기준이 없으면 팀 간 실행 편차가 발생한다.
3. ownership 정책 유지에도 MCP 사용 경로(`packages/ui` 중심)가 함께 고정되어야 한다.

### Refine 결정 (MCP)

1. shadcn MCP 설정 참조 링크를 setup 표준 절차에 포함한다.
2. MCP 사용 시에도 `init/add/export/story` 소유 경계를 동일하게 강제한다.
3. MCP 관련 실행/실패 로그를 setup 문서에 남기는 규칙을 추가한다.

## Review (Spec Step)

### 확인된 이슈

1. 이전 문서는 구현 완료 이력이 섞여 현재 저장소 상태(구현 코드 제거)와 불일치했다.
2. 컴포넌트 소유 경계(`packages/ui` 전담)가 요구사항으로 충분히 강제되지 않았다.
3. Storybook 영역에 UI 구현이 재유입되는 회귀 방지 기준이 약했다.

### Refine 결정

1. 컴포넌트 소유 경계를 기능 요구사항으로 승격한다.
2. Storybook은 story/docs/tests 전용 영역으로 제한한다.
3. 컴포넌트-스토리 매핑 카탈로그와 ownership guard를 필수 산출물로 추가한다.

## Review (Implementation Retrospective)

### 확인된 이슈 (2026-02-12)

1. `Input/Textarea/Select` 포커스 시 브라우저 기본 outline이 노출되어 시각 일관성이 깨졌다.
2. `Calendar` 클래스 일부가 Tailwind v3 환경에서 해석되지 않아 스타일 누락이 발생했다.
3. 문서는 "재시작/초기화" 관점에 머물러 있어 실제 구현 완료 상태 및 재생성 기준이 약했다.

### Refine 결정 (Implementation)

1. 입력 계열 컴포넌트에 `focus-visible:outline-none`과 완만한 ring 스타일을 적용해 기본 outline 노출을 제거한다.
2. `Calendar`의 유틸리티를 Tailwind v3 호환 문법으로 정리해 Storybook에서 동일한 렌더링을 보장한다.
3. setup/spec/plan/tasks에 실행 로그와 재생성 런북을 남겨 "문서만으로 재현 가능" 상태를 만든다.

## Review (Theme Readiness)

### 확인된 이슈 (2026-02-12)

1. 현재 컴포넌트 대부분은 semantic token(`--background`, `--ring` 등) 기반이나, 테마 전환 규칙이 문서로 고정되지 않았다.
2. 향후 테마 작업 시 토큰 변경과 컴포넌트 구조 변경이 섞이면 회귀 위험이 높다.

### Refine 결정 (Theme)

1. 차기 테마 변경은 "토큰 레이어 우선, 컴포넌트 클래스 최소 변경" 원칙으로 진행한다.
2. Storybook에 구현 상태 배지(완료/진행중)를 유지해 회귀 확인 지점을 시각적으로 고정한다.
3. 테마 변경 완료 시 `typecheck/test/build-storybook`을 필수 회귀 게이트로 반복 실행한다.

## User Scenarios & Testing

### User Story 1 - shadcn/ui 컴포넌트 소스 일원화 (Priority: P1)

개발자는 shadcn/ui 계열 컴포넌트 소스를 `packages/ui/src/components/ui`에서만 관리할 수 있어야 한다.

**Why this priority**: 컴포넌트 소유 경계가 무너지면 유지보수 비용이 급격히 커진다.

**Independent Test**: `apps/storybook/src`에서 UI 구현 파일이 없는지 검사하고, `packages/ui`에만 UI 소스가 존재하는지 확인.

**Acceptance Scenarios**:

1. **Given** 저장소를 검사할 때, **When** UI 구현 파일 위치를 확인하면, **Then** `packages/ui/src/components/ui`에만 존재해야 한다.
2. **Given** 신규 UI 컴포넌트를 추가할 때, **When** 절차를 수행하면, **Then** `shadcn CLI add -> export -> story` 흐름을 따라야 한다.

---

### User Story 2 - Storybook은 문서/스토리 소비 계층 (Priority: P1)

개발자는 `apps/storybook`에서 `@repo/ui`를 import해 컴포넌트를 사용하고, story/docs/tests만 유지해야 한다.

**Why this priority**: Storybook이 구현 계층을 침범하면 구조 경계가 깨진다.

**Independent Test**: 모든 `*.stories.tsx`가 인터랙티브 UI를 `@repo/ui`에서 import하는지 확인.

**Acceptance Scenarios**:

1. **Given** 컴포넌트 스토리 파일, **When** import를 확인하면, **Then** 인터랙티브 UI는 `@repo/ui` 경유여야 한다.
2. **Given** 레이아웃 데모 예외, **When** 네이티브 마크업을 쓰면, **Then** 예외 목적이 문서화되어야 한다.

---

### User Story 3 - ownership 회귀 방지 (Priority: P2)

QA는 UI 구현 유입 회귀를 자동으로 점검할 수 있어야 한다.

**Why this priority**: 운영 중 구조가 가장 쉽게 무너지는 지점이다.

**Independent Test**: ownership guard 테스트를 실행해 금지 경로 위반을 탐지.

**Acceptance Scenarios**:

1. **Given** Storybook 소스에 UI 구현 파일이 추가되면, **When** guard를 실행하면, **Then** 실패해야 한다.
2. **Given** 정상 구조일 때, **When** guard를 실행하면, **Then** 통과해야 한다.

## Requirements

### Functional Requirements

- **FR-001**: shadcn/ui 컴포넌트 소스는 `packages/ui/src/components/ui/`에만 존재해야 한다.
- **FR-002**: `packages/ui`는 `components.json`을 포함하고 shadcn CLI/registry 기반 설치 절차를 문서화해야 한다.
- **FR-003**: `apps/storybook/src`는 `stories`, `docs`, `tests`, `_shared`만 포함해야 하며 재사용 UI 구현 파일을 두지 않아야 한다.
- **FR-004**: Storybook 스토리의 인터랙티브 UI는 `@repo/ui` import를 사용해야 한다.
- **FR-005**: 컴포넌트-스토리 매핑 카탈로그 문서를 제공해야 한다.
- **FR-006**: ownership guard 테스트를 제공해야 한다.
- **FR-007**: setup 문서에 `shadcn CLI add -> export -> story` 워크플로우를 명시해야 한다.
- **FR-008**: 기존 monorepo 설치 표준 명령은 아래 순서를 따라야 한다.
  1. `pnpm dlx shadcn@latest init --cwd packages/ui`
  2. `pnpm dlx shadcn@latest add <component> --cwd packages/ui`
  3. `packages/ui/src/index.ts` export 반영
  4. `apps/storybook/src/stories`에서 `@repo/ui` import로 소비
- **FR-009**: 설치 검증 시 `components.json` schema/aliases, 생성된 컴포넌트 파일, Storybook import 경로를 함께 확인해야 한다.
- **FR-010**: setup 문서는 shadcn MCP 설정 참조(`https://ui.shadcn.com/docs/mcp?utm_source=chatgpt.com`)를 포함해야 한다.
- **FR-011**: MCP 기반 워크플로우를 사용할 때도 컴포넌트 생성 위치는 `packages/ui`로 고정되어야 하며, Storybook은 `@repo/ui` 소비 계층만 유지해야 한다.
- **FR-012**: MCP 사용/실패 이력(예: 연결 실패, 권한 문제, 재시도 절차)을 `README-setup.md`에 기록해야 한다.
- **FR-013**: 입력 계열(`input`, `textarea`, `select`)은 `focus-visible` 시 브라우저 기본 outline 대신 디자인 시스템 ring 스타일을 사용해야 한다.
- **FR-014**: `calendar` 컴포넌트는 프로젝트 Tailwind 버전과 호환되는 클래스 문법을 사용해 Storybook에서 스타일이 동일하게 적용되어야 한다.
- **FR-015**: setup 문서는 "클린 상태에서 전체 재생성" 가능한 명령 순서(runbook)와 각 단계 검증 포인트를 포함해야 한다.
- **FR-016**: Storybook 컴포넌트 스토리에는 구현 상태(`completed` / `in-progress`)를 시각적으로 구분할 수 있는 표기를 제공해야 한다.

### Key Entities

- **UI Primitive**: `packages/ui/src/components/ui/*`의 shadcn/ui 기반 컴포넌트
- **Story Artifact**: `apps/storybook/src/stories/*`의 스토리 파일
- **Ownership Guard**: 금지 경로(UI 구현 in storybook) 탐지 테스트

## Success Criteria

- **SC-001**: `spec.md`, `plan.md`, `tasks.md`가 요구사항(FR-001~FR-016)을 동일하게 참조한다.
- **SC-002**: `shadcn-component-catalog.md`에 컴포넌트-스토리 매핑이 존재한다.
- **SC-003**: `apps/storybook/src/tests/ui-ownership-guard.test.ts`가 존재하고 규칙을 검증한다.
- **SC-004**: setup 문서에 CLI 기반 추가 절차와 예외 규칙이 존재한다.
- **SC-005**: 설치/추가 명령 실행 로그 또는 실패 원인(EACCES 등)과 재시도 방안이 문서화되어 있다.
- **SC-006**: 포커스/캘린더 스타일 회귀 수정이 코드와 문서에 함께 기록되어 재생성 시 동일 품질을 보장한다.
- **SC-007**: Storybook에서 구현 상태 시각 표기와 실제 동작 데모를 함께 확인할 수 있다.
