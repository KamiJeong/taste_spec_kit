Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Email Auth User Management (Frontend)

**Branch**: `spec/03-email-auth-frontend`  
**Date**: 2026-02-12  
**Updated**: 2026-02-23  
**Spec**: [spec.md](./spec.md)

## Tech Stack Reference Rule

- 계획의 라이브러리/버전 기준은 `specs/00-tech-stack.md`를 우선한다.
- 스택 변경 시 `00-tech-stack.md`를 먼저 갱신하고 본 계획을 동기화한다.

## Summary

백엔드 계약 확정 이후 프론트 인증 UX를 단계적으로 구현한다. 폼/라우팅/상태관리 중심으로 진행하며 API 계약은 변경하지 않는다.

## Milestones

1. 인증 페이지 IA 및 라우팅 구조 확정
2. 폼 컴포넌트/검증/에러 상태 구현
3. 보호 라우트 및 세션 동기화
4. API Envelope 파싱/에러 정규화/요청 추적 헤더 보존
5. E2E 기준 시나리오 검증

## Technical Boundaries

- Next.js App Router + react-hook-form + Zod
- API 클라이언트는 `contracts/*.md` + `packages/contracts-auth` 계약 준수
- 백엔드 세부 구현에 직접 의존하지 않음
- frontend typecheck/CI는 `@packages/contracts-auth build` 이후 실행

## Requirement Traceability

- FR-FE-009/010: 공용 계약 타입 소비 + declaration 정합성 검증
- FR-FE-011: API envelope 파싱 및 `X-Request-Id` 보존 규칙으로 고정
- TR-FE-006: CI/typecheck 선행 빌드 단계로 충족
- TR-FE-007: API 어댑터 테스트(성공/실패 envelope + request-id 보존)로 충족

## Exit Criteria

- P1 화면(회원가입/로그인) 완료
- 비밀번호 재설정 및 프로필 화면 완료
- 보호 라우트 동작 및 실패 UX 검증 완료
- API Envelope Consumption Rules 준수 및 어댑터 테스트 통과
