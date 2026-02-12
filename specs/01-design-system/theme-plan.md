Tech-Stack: specs/00-tech-stack.md

# Theme Plan: 01-design-system

**Feature**: `01-design-system`
**Date**: 2026-02-12
**Status**: T1 Locked (Execution Ready)

## Goal

`packages/ui`의 semantic token 기반 스타일을 중심으로 브랜드 테마를 확장하고, Storybook에서 컴포넌트 동작/접근성 회귀 없이 적용한다.

## Scope

- In scope:
  - `@repo/ui` 공통 토큰 레이어 정리 (`styles.css`)
  - Storybook에서 테마별 시각 검증 시나리오 추가
  - 핵심 인터랙션 컴포넌트 회귀 점검 (`input/textarea/select/calendar/sonner`)
- Out of scope:
  - 컴포넌트 API breaking change
  - 레이아웃/정보구조 전면 개편

## Principles

1. Token-first: 색상/반경/그림자/링 대비는 토큰으로 먼저 해결한다.
2. Minimal class churn: 컴포넌트 클래스 수정은 토큰만으로 해결이 불가능할 때만 수행한다.
3. Consumer safety: Storybook은 계속 `@repo/ui` 소비 계층을 유지한다.

## T1 Decision Lock (2026-02-12)

1. Theme modes:
   - `light` (default)
   - `dark`
   - `brand` (brand light)
   - `brand-dark`
2. Tailwind strategy:
   - 현재 라운드는 Tailwind v3 유지
   - v4 마이그레이션은 별도 migration 트랙으로 분리
3. Accessibility baseline:
   - focus-visible 링은 컴포넌트 배경 대비 인지 가능해야 함
   - 주요 텍스트/상태 색상은 WCAG 2.1 AA(일반 텍스트 4.5:1) 목표
4. Ownership rule:
   - 토큰은 `packages/ui/src/styles/styles.css`에서 관리
   - Storybook은 토큰 소비/검증 계층으로 유지

## Phase Plan

### Phase T1 - Theme Strategy Lock

1. 테마 정책 확정: `light`, `dark`, `brand`, `brand-dark` (done)
2. Tailwind 전략 확정: v3 유지, v4는 별도 마이그레이션 (done)
3. 접근성 기준 확정: focus-visible/텍스트 대비 기준 고정 (done)

### Phase T2 - Token Layer Design

1. `packages/ui/src/styles/styles.css` 토큰 맵 정의 (done)
2. 상태 토큰 확장: `--focus-ring`, `--calendar-*`, `--toast-*` (done)
3. 캘린더/입력 계열 상태 토큰 매핑 표 작성 (`theme-token-map.md`) (done)

### Phase T3 - Storybook Theme Surface

1. 테마 전환 데코레이터 또는 글로벌 툴바 설정 (done)
2. 핵심 스토리에 테마별 상태 스냅샷 섹션 추가 (`Input`, `Select`, `Calendar`, `Sonner`) (done)
3. 구현 상태 배지(`completed`/`in-progress`)는 유지

### Phase T4 - Regression Gates

1. `pnpm typecheck`
2. `pnpm test`
3. `pnpm build-storybook`
4. 수동 점검: focus-visible, calendar states, sonner/toast tone

## Validation Checklist

- [ ] `input/textarea/select` 포커스 시 기본 outline 재노출 없음
- [ ] `calendar` today/range/disabled/outside 상태 구분 유지
- [ ] `sonner/toast`가 테마별로 대비/가독성 유지
- [ ] Storybook에서 테마 전환 시 class/token mismatch 없음

## Risks and Mitigations

1. Tailwind 버전 불일치 리스크
   - Mitigation: T1에서 버전 전략 선결정 후 문서/설정 동기화
2. 토큰 누락으로 컴포넌트별 임시 클래스 증가
   - Mitigation: 토큰 테이블 선작성 후 변경, PR에서 class churn 제한
3. 테마별 대비 저하
   - Mitigation: 포커스 링/텍스트 대비 수동 점검을 게이트에 포함

## Deliverables

1. 테마 전략 결정 기록 (버전 포함)
2. 토큰 정의/매핑 문서 업데이트
3. Storybook 테마 검증 시나리오
4. 게이트 실행 로그
