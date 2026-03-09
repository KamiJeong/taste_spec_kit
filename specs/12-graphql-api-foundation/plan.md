Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: GraphQL API Foundation

**Branch**: `feature/graphql-api-foundation` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/12-graphql-api-foundation/spec.md`

## Overview

REST를 유지한 상태에서 GraphQL foundation을 병행 구축한다.

핵심 전략:
- GraphQL은 API surface만 추가
- 도메인 로직은 기존 service/persistence 재사용
- auth/role/security는 REST와 동일 기준 강제

## Tech Stack Alignment

- Backend: NestJS 11 + TypeScript strict
- API: REST(existing) + GraphQL(new parallel surface)
- DB/Validation: PostgreSQL + Drizzle + Zod(existing)

`specs/00-tech-stack.md`와 충돌 없음.

## Proposed Architecture

- `apps/api/src/modules/graphql/`
  - `graphql.module.ts`
  - `common/graphql-context.ts`
  - `common/graphql-response.ts`
  - `common/graphql-csrf.ts`
  - `common/graphql-audit.ts`
- 도메인 resolver(기존 모듈 병행)
  - `apps/api/src/modules/auth/auth.resolver.ts`
  - `apps/api/src/modules/user/user.resolver.ts`
  - `apps/api/src/modules/channel/channel.resolver.ts`
  - `apps/api/src/modules/channel-post/channel-post.resolver.ts`
  - 각 모듈 `graphql/*.types.ts`로 ObjectType 분리
- App wiring
  - `apps/api/src/modules/index.ts`에서 `API_GRAPHQL_ENABLED` 기반 `ApiGraphqlModule` 조건부 등록
  - env flag 기반 introspection/playground 제어

## Security & Policy

- 기존 auth/session 컨텍스트를 GraphQL context에 주입
- role guard 재사용 또는 동일 규칙 guard 추가
- GraphQL Query는 인증만 요구, Mutation은 CSRF 검증 추가 적용
- production 기본값:
  - introspection: off
  - playground: off
- 추후 complexity/depth limiter 적용(phase 2)

## Testing Strategy

- Unit:
  - resolver-level 권한 분기
- Integration:
  - `/graphql` Query/Mutation 성공/실패 케이스
  - `API_GRAPHQL_ENABLED=false`일 때 `/graphql`, `/graphql/ui` 404 검증
  - 비인증/비권한 접근 차단 검증
- Regression:
  - 기존 REST test suite 통과

## Delivery Phases

1. GraphQL foundation setup (dependency + module wiring + kill switch)
2. Domain surface 확장(auth/user/channel/channel-post)
3. Security hardening(CSRF for mutation) + tests + docs
4. Resolver 구조 정리(공통 유틸 + 타입 파일 분리)
