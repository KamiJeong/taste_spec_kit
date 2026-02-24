Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Email Auth User Management (Backend)

**Branch**: `spec/02-email-auth-backend`  
**Date**: 2026-02-12  
**Updated**: 2026-02-23  
**Spec**: [spec.md](./spec.md)

## Tech Stack Reference Rule

- 계획의 스택/버전 기준은 `specs/00-tech-stack.md`를 단일 기준으로 사용한다.
- 구현 단계에서 스택 변경이 필요하면 `00-tech-stack.md` 갱신 후 본 계획을 동기화한다.

## Summary

기존 통합 스펙에서 Backend 경계를 먼저 완료한다. 현재 P1/P2는 완료되었고, 남은 범위는 Gate 5/6(보안/운영/자동화)와 인프라 강제 규칙 고도화다.

## Current Repository Reality Check (2026-02-23)

- `apps/api`는 NestJS 11 기반으로 복구되어 동작 중이며 Gate 3/4 테스트가 통과한 상태다.
- `packages/contracts-auth`는 TypeScript source + build 산출물 소비 구조를 유지한다.
- 로컬 인프라 기준 파일(`.env.template`, `apps/api/.env.template`, `docker-compose.yml`)이 추가되었다.
- 다음 우선순위는 Gate 5/6 및 Postgres/Redis 강제 실행 정책(통합/E2E/프로덕션 fallback 금지) 확정이다.

## Step-by-Step Review & Refine (2026-02-23)

1. Spec 정합성 점검: Postgres/Redis/Drizzle 강제 조건을 명문화한다.
2. Plan 정렬: Gate 3/4 완료 상태를 반영하고 남은 범위(Gate 5/6)를 재우선순위화한다.
3. Tasks 재배열: 환경 템플릿/도커 기준과 인프라 강제 검증 태스크를 추가한다.
4. 구현 반영: in-memory fallback 제거, migration 절차, 인프라 실패 감지 테스트를 순차 적용한다.

## Milestones

1. Gate 0~4 산출물 상태 재검증(완료 상태 유지)
2. 보안/운영 요구사항(Gate 5) 구현
3. Postgres/Redis 강제 실행 정책 및 Drizzle migration 체계 확정
4. 로컬 통합 검증 고정 (`.env.template` + `docker-compose.yml`)
5. 테스트 자동화/CI(Gate 6) 완성

## Phase Gates

- Gate 0: `apps/api` 부팅 + 테스트 명령 4종(`test`, `test:unit`, `test:integration`, `test:e2e`) 실행 가능
- Gate 1: Nest 모듈 분해/경계 문서 및 코드 구조가 `spec.md`와 일치(FR-BE-009)
- Gate 2: 계약 문서가 `spec.md` API Surface/Transport + Envelope/Headers + Idempotency + AuditLog schema + Shared TS package 기준과 일치(FR-BE-015~018)
- Gate 3: US-BE-1/2(P1) 엔드포인트 구현 완료 및 핵심 실패 케이스 테스트 통과
- Gate 4: US-BE-3/4(P2) 구현 완료 및 토큰/세션/권한 테스트 통과
- Gate 5: US-BE-5(P3) + 보안/운영 요구사항(FR-BE-004, FR-BE-007, FR-BE-015~020) 검증 완료
- Gate 6: TR-BE-001~014 충족 + CI 파이프라인 green

## Deliverables

- 백엔드 런타임 골격: `apps/api/*`
- 아키텍처 산출물: Nest 모듈 구성 및 의존 경계 문서
- API 계약 문서: `specs/02-email-auth-backend/contracts/auth-api.md`, `specs/02-email-auth-backend/contracts/user-api.md`
- 공용 계약 모델: `packages/contracts-auth` (`zod schema` + `inferred type` + error code)
- 테스트 산출물: 단위/통합/E2E 스위트 및 `.env.test` 실행 가이드
- 품질 게이트: CI workflow (`typecheck + lint + unit + integration`)

## Technical Boundaries

- NestJS + better-auth + Drizzle + PostgreSQL + Redis + BullMQ
- API transport는 REST를 기준으로 하며, GraphQL은 선택적 adapter로만 추가
- API 계약 변경 시 `contracts/*.md` 먼저 갱신
- 프론트 요구사항으로 인해 API를 선변경하지 않음 (계약 우선)

## Requirement Traceability

- FR-BE-001/003/005/008: Auth Core 단계에서 구현 및 단위/통합 테스트로 검증
- FR-BE-002/004/006/007: Security & Ops 단계에서 강제 및 회귀 테스트 고정
- FR-BE-009/010: Architecture Freeze 단계에서 경계 검증 + 계약 테스트로 고정
- FR-BE-011/014: 계약 변경 동기화 + 공용 계약(`packages/contracts-auth`) 타입 검증으로 고정
- FR-BE-012/013: 상태 전이/보안 베이스라인 테스트로 고정
- FR-BE-015/016/017: Envelope/Headers + Idempotency + AuditLog schema 테스트로 고정
- FR-BE-018: 공용 계약 패키지 TS source + declaration build로 고정
- TR-BE-001~003: 테스트 스크립트/스위트 구성으로 충족
- TR-BE-004: CI 파이프라인 고정으로 충족
- TR-BE-005: `.env.test` + 시드/초기화 문서로 충족
- TR-BE-006~011: 상태 전이/보안 회귀/계약 직렬화/헤더/idempotent/감사로그 필드 테스트로 충족
- TR-BE-012: backend 테스트 전 `@packages/contracts-auth build` 선행으로 충족
- TR-BE-013: Drizzle migration 절차/명령 문서화 및 실행 검증으로 충족
- TR-BE-014: DB/Redis 누락/미연결 fail-fast 검증 테스트로 충족

## New Task Alignment (2026-02-23)

- Contract Freeze: `BE-T036`, `BE-T037`, `BE-T038`
- Contract Freeze(+TS): `BE-T045`
- Security/Ops: `BE-T039`, `BE-T040`, `BE-T041`
- Test Automation: `BE-T042`, `BE-T043`, `BE-T044`, `BE-T046`

## Risks and Mitigations

- 리스크: 저장소에 백엔드 코드가 없어 추정 기반 설계로 흐를 수 있음  
  완화: 해당 리스크는 해소되었으며, 신규 리스크는 인프라 fallback 혼입 여부로 전환
- 리스크: 인증 계약과 구현의 드리프트  
  완화: 계약 문서 선수정 후 구현 원칙, PR 체크리스트에 계약 diff 포함
- 리스크: 외부 인프라(메일/Redis)로 테스트 불안정  
  완화: 테스트 더블/로컬 컨테이너 고정, E2E와 통합 테스트를 분리

## Exit Criteria

- P1 API(회원가입/인증/로그인) 동작 확인
- 비밀번호 재설정 포함 P2 API 검증
- AuthLog/Rate Limit/토큰 만료 + Envelope/Headers/Idempotency 검증 완료
- 모듈 경계 위반 없음(Auth/User/Session/Token/Infra 분리)
- 문서에 정의된 테스트 명령이 로컬에서 실제 성공
