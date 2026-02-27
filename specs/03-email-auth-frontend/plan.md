Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Email Auth Frontend

**Branch**: `feature/email-auth-frontend` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/03-email-auth-frontend/spec.md`

## Tech Stack Reference Rule

- 계획의 스택/버전 기준은 `specs/00-tech-stack.md`를 단일 기준으로 사용한다.
- 구현 중 스택 변경이 필요하면 먼저 `00-tech-stack.md`를 업데이트하고 본 계획을 동기화한다.

## Summary

`apps/web`에 Next.js 기반 인증 UI를 구축하고, backend auth contracts를 그대로 소비한다. UI는 `packages/ui` + `react-hook-form` + `zod`를 사용해 일관된 입력/검증/에러 처리 규칙을 적용한다.
세션 제어는 장기적으로 `better-auth` client를 목표로 하되, 단기적으로는 REST 계약을 `AuthAdapter` 뒤에 캡슐화해 안전하게 단계 전환한다.
구현 운영성 강화를 위해 TanStack Query 기반 auth state/mutation 관리와 development 전용 Dev Auth Tools 패널을 추가한다.

## Review Decisions (2026-02-26)

1. 초기 구현은 REST adapter 고정, direct endpoint 호출 금지
2. 공통 `Auth Shell Layout`으로 페이지 구조 표준화
3. better-auth 전환은 adapter 교체만으로 가능하도록 인터페이스 우선 설계

## Review Decisions (2026-02-26, Cycle 2)

1. auth 요청/세션 상태는 TanStack Query hook 레이어로 통합한다.
2. 로컬 토큰 테스트를 위한 dev-only floating action panel을 제공한다.
3. `/auth/me` 응답 타입 불일치 구간을 adapter 타입에서 정합화한다.
4. `@repo/ui` 스타일 파리티를 위해 source scan 및 token class 적용 기준을 문서화한다.

## Technical Context

- **Language/Version**: TypeScript `^5.9.0`, Node.js `22.x`
- **Primary Dependencies**: Next.js `^15.1.0`, React `^19.0.0`, Tailwind CSS `^4.0.0`, react-hook-form `^7.54.0`, zod `^4.3.0`
- **State Management for Auth Flow**: TanStack Query (auth query/mutation 및 session invalidation 표준화 용도)
- **Shared UI**: `packages/ui` (shadcn/ui ownership 규칙 준수)
- **Contracts**: `packages/contracts-auth`, `specs/02-email-auth-backend/contracts/*`
- **Auth Strategy**: Adapter pattern (`RestAuthAdapter` -> `BetterAuthAdapter` migration-ready)
- **Testing**: Playwright (E2E 우선), Vitest (컴포넌트/유닛)
- **Project Type**: Turborepo monorepo (`apps/web`)

## Current Status (2026-02-27)

- Milestone 1~10 구현 항목은 완료되었고, 최종 검증 게이트도 통과했다.
- 검증 완료 항목:
  - P1 사용자 스토리 회귀 확인 (통합 UI 테스트 기준)
  - 타입체크/테스트 재검증 통과
  - spec/plan/tasks 문서 정합성 최종 확인

## Constitution Check

- SSOT 준수: `specs/00-tech-stack.md`를 기준으로 버전/라이브러리 결정
- Type-Safety: TS strict + zod runtime validation
- Local-First: `.env.template` 기반 로컬 설정
- Boundary: backend 계약 변경 없이 frontend adapter 레이어만 구현
- Migration safety: 구현 의존점은 adapter 인터페이스로 제한

## Project Structure

### Documentation (this feature)

```text
specs/03-email-auth-frontend/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/page.tsx
│   └── page.tsx
├── src/
│   ├── features/auth/
│   │   ├── api/
│   │   ├── dev/
│   │   ├── schemas/
│   │   └── ui/
│   ├── test/
│   ├── lib/
│   └── types/
└── package.json
```

## Milestones

1. `apps/web` 초기화 + Tailwind/TS strict 정렬
2. Auth API client + error mapping 레이어 구현
3. `AuthAdapter` 인터페이스 + `RestAuthAdapter` 구현
4. 공통 `Auth Shell Layout` 구현 + 반응형 기준 고정
5. P1 화면(회원가입/로그인/비밀번호 찾기/재설정/이메일 인증) 구현
6. 세션 상태(`/auth/me`) 및 로그아웃 경로를 adapter 기반으로 연결
7. TanStack Query 기반 query/mutation 통합 + session invalidation 반영
8. dev-only auth tools(토큰/세션 빠른 액션) 제공
9. `BetterAuthAdapter` 전환 준비(인터페이스 호환 테스트/문서)
10. 테스트/타입체크/문서 동기화

## Requirement Traceability

- FR-FE-001/002: 앱 부트스트랩 + UI 컴포넌트 경계
- FR-FE-003~006: auth 화면과 API 계약 매핑
- FR-FE-007/008: form validation + error UX 표준화
- FR-FE-009/010: 세션/CSRF 처리
- FR-FE-011: 문서 헤더 Tech-Stack 라인 고정
- FR-FE-012~015: adapter 경계 고정 + 단계적 better-auth 전환 안전성 확보
- FR-FE-016/017: 공통 auth shell + 반응형 레이아웃 기준
- FR-FE-018~021: query 통합 + dev tools + 응답 타입 정합 + style parity 기준

## Risks and Mitigations

- 리스크: backend contract와 frontend payload 불일치  
  완화: `packages/contracts-auth` 타입 우선 사용 + contract diff 체크
- 리스크: 인증 에러 UX 분산  
  완화: 코드-메시지 매핑 단일 모듈화
- 리스크: 라우트/폼 구조 중복  
  완화: `features/auth` 내 폼/스키마/컴포넌트 재사용
- 리스크: better-auth 직접 도입 시 기존 REST 계약과 충돌  
  완화: adapter 인터페이스 우선 적용 후 점진 전환

## Adapter Migration Flag Strategy

- 런타임 선택 플래그: `NEXT_PUBLIC_AUTH_ADAPTER`
  - `rest` (default): `RestAuthAdapter`
  - `better`: `BetterAuthAdapter`
- 현재 단계(Phase A) 기본값은 `rest`이며 production 기본 구성도 `rest`로 유지한다.
- `better` 모드는 migration 검증/개발 실험 용도로만 사용하고, backend parity 확보 전 기본값으로 승격하지 않는다.
- 호환성 기준:
  - `AuthAdapter` 메서드 시그니처 일치
  - 동일 호출 지점(폼/세션 UI)에서 구현 교체만으로 동작
  - adapter 호환 테스트(`FE-T026`)를 CI/로컬 테스트에 포함

## Exit Criteria

- P1 auth 플로우 화면/연동 완료
- 계약 기준 API 요청/응답 매핑 검증 완료
- adapter 기반 session control + migration 준비 완료
- typecheck + 핵심 테스트 통과
