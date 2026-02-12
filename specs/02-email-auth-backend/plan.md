# Implementation Plan: Email Auth User Management (Backend)

**Branch**: `spec/02-email-auth-backend`  
**Date**: 2026-02-12  
**Spec**: [spec.md](./spec.md)

## Summary

기존 통합 스펙에서 Backend 경계를 먼저 완료한다. API/도메인/인프라를 선행 구현하고, 이후 Frontend 스펙이 해당 계약을 소비한다.

## Current Repository Reality Check (2026-02-12)

- 현재 저장소 기준으로 추적 가능한 백엔드 앱 코드(`apps/api`)가 없다.
- 루트 워크스페이스 매니페스트(`package.json`, `pnpm-workspace.yaml`, `turbo.json`)가 없다.
- 따라서 테스트 코드를 "작성/실행"할 기본 런타임 진입점이 부재하다.

## Milestones

1. 저장소 실행 기반 복구 (workspace + apps/api + test scripts)
2. 인증/회원관리 API 계약 고정
3. 도메인 로직(Auth/User/Email) 구현
4. 보안/로그/레이트리밋 적용
5. 로컬 통합 검증 (PostgreSQL/Redis/Mailhog)
6. 테스트 자동화 검증 (unit/integration/e2e)

## Phase Gates

- Gate 0: `apps/api` 부팅 + 테스트 명령 4종(`test`, `test:unit`, `test:integration`, `test:e2e`) 실행 가능
- Gate 1: `contracts/auth-api.md`, `contracts/user-api.md`가 `spec.md` API Surface와 일치
- Gate 2: US-BE-1/2(P1) 엔드포인트 구현 완료 및 핵심 실패 케이스 테스트 통과
- Gate 3: US-BE-3/4(P2) 구현 완료 및 토큰/세션/권한 테스트 통과
- Gate 4: US-BE-5(P3) + 보안 요구사항(FR-BE-004, FR-BE-007) 검증 완료
- Gate 5: TR-BE-001~005 충족 + CI 파이프라인 green

## Deliverables

- 백엔드 런타임 골격: `apps/api/*`
- API 계약 문서: `specs/02-email-auth-backend/contracts/auth-api.md`, `specs/02-email-auth-backend/contracts/user-api.md`
- 테스트 산출물: 단위/통합/E2E 스위트 및 `.env.test` 실행 가이드
- 품질 게이트: CI workflow (`typecheck + lint + unit + integration`)

## Technical Boundaries

- NestJS + better-auth + Drizzle + PostgreSQL + Redis + BullMQ
- API 계약 변경 시 `contracts/*.md` 먼저 갱신
- 프론트 요구사항으로 인해 API를 선변경하지 않음 (계약 우선)

## Requirement Traceability

- FR-BE-001/003/005/008: Auth Core 단계에서 구현 및 단위/통합 테스트로 검증
- FR-BE-002/004/006/007: Security & Ops 단계에서 강제 및 회귀 테스트 고정
- TR-BE-001~003: 테스트 스크립트/스위트 구성으로 충족
- TR-BE-004: CI 파이프라인 고정으로 충족
- TR-BE-005: `.env.test` + 시드/초기화 문서로 충족

## Risks and Mitigations

- 리스크: 저장소에 백엔드 코드가 없어 추정 기반 설계로 흐를 수 있음  
  완화: Gate 0 통과 전 기능 작업 금지
- 리스크: 인증 계약과 구현의 드리프트  
  완화: 계약 문서 선수정 후 구현 원칙, PR 체크리스트에 계약 diff 포함
- 리스크: 외부 인프라(메일/Redis)로 테스트 불안정  
  완화: 테스트 더블/로컬 컨테이너 고정, E2E와 통합 테스트를 분리

## Exit Criteria

- P1 API(회원가입/인증/로그인) 동작 확인
- 비밀번호 재설정 포함 P2 API 검증
- AuthLog/Rate Limit/토큰 만료 검증 완료
- 문서에 정의된 테스트 명령이 로컬에서 실제 성공
