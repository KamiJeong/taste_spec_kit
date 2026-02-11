# UI Resolution Decision (RQ1)

**Date**: 2026-02-10  
**Feature**: `01-storybook-shadcn-forms`

## Decision

RQ1는 다음과 같이 확정한다.

- `shadcn/ui`는 외부 런타임 패키지 의존 대신, 저장소 내부 로컬 벤더링 방식(`packages/ui`)을 표준으로 사용한다.

## Rationale

1. **Local-First**: 네트워크/레지스트리 상태와 무관하게 동일한 컴포넌트 기반으로 개발 가능
2. **SSOT**: 컴포넌트 구현/토큰/유틸을 저장소 내 단일 위치에서 관리 가능
3. **Type-Safety**: 내부 타입과 경로 alias를 일관되게 유지하기 쉬움
4. **Change Control**: 외부 패키지 변동 없이 필요한 컴포넌트만 점진적으로 도입 가능

## Implementation Notes

1. 워크스페이스에 `packages/ui`를 생성한다.
2. Storybook 앱(`apps/storybook`)에서 `ui` 또는 `@repo/ui` alias를 사용한다.
3. `apps/storybook/tsconfig.json`에 path mapping을 추가한다.
4. 초기 범위는 `Button`, `Input`, `Select`, `Checkbox`, `Radio`, `Dialog`, `Form` 컴포넌트로 제한한다.

## Non-Goals

- 현 단계에서 외부 UI 런타임 패키지 자동 설치는 수행하지 않는다.
- 디자인 토큰 체계 전면 개편은 범위에 포함하지 않는다.

