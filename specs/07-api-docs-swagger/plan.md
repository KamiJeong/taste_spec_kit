Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: API Docs with Swagger

**Branch**: `feature/api-docs-swagger` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/07-api-docs-swagger/spec.md`

## Tech Stack Reference Rule

- 계획의 스택/버전 기준은 `specs/00-tech-stack.md`를 단일 기준으로 사용한다.
- 구현 단계에서 스택 변경이 필요하면 `00-tech-stack.md` 갱신 후 본 계획을 동기화한다.

## Summary

NestJS API(`apps/api`)에 Swagger/OpenAPI 문서화를 도입해 개발/테스트 단계에서 계약 가시성을 높이고, 운영 환경에서는 문서 노출을 제어 가능한 구조로 구현한다.

## Current Repository Reality Check (2026-03-04)

- `apps/api/src/main.ts`는 현재 Swagger bootstrap 코드가 없다.
- auth/user controller는 `zod` 검증 + 수동 응답 작성 구조이며 swagger decorator가 아직 없다.
- e2e smoke 테스트는 현재 스캐폴드 수준이므로 docs endpoint 검증이 추가되어야 한다.

## Technical Context

- **Runtime**: NestJS 11 (`apps/api`)
- **Primary Library**: `@nestjs/swagger` (OpenAPI generation + Swagger UI)
- **Doc Endpoint**: `/api/docs`
- **OpenAPI JSON Endpoint**: `/api-json`
- **Security Note**: production 환경에서 문서 endpoint 보호/비활성 정책 적용
- **Env Contract**: `API_DOCS_ENABLED`, `API_DOCS_PROTECTED`
- **Controller Coverage**:
  - `apps/api/src/modules/auth/auth.controller.ts`
  - `apps/api/src/modules/user/user.controller.ts`
- **Bootstrap Target**: `apps/api/src/main.ts`

## Phases

1. Swagger 라이브러리 및 부트스트랩 구성
2. 공통 문서 메타데이터/보안 스키마 정의
3. Auth/User 엔드포인트 데코레이터 기반 문서 반영
4. Envelope/에러 응답 문서 표준화
5. production 노출 제어 정책 적용
6. 테스트 및 문서 검증

## Step-by-Step Review & Refine (2026-03-04)

1. spec의 API Surface/FR/TR 기준을 코드 구조와 대조해 과대 범위를 제거한다.
2. bootstrap 경로(`/api/docs`, `/api-json`)와 env 기반 노출 제어 설계를 확정한다.
3. 컨트롤러 단위 문서화 범위를 auth/user 우선으로 제한해 1차 완료 목표를 고정한다.
4. 테스트에 docs endpoint 검증을 추가하고 Done checklist에 FR/NFR/TR 추적을 고정한다.

## Requirement Traceability

- FR-SW-001/002/006: Swagger bootstrap + endpoint wiring
- FR-SW-003: auth/user route coverage 검증
- FR-SW-004: 공통 응답 스키마(성공/실패 envelope) 반영
- FR-SW-005: cookie auth + CSRF header 보안 요구 문서화
- FR-SW-007: production docs exposure 제어
- FR-SW-008/009: 기술 스택 정합성 및 Spec Kit 문서 기준 유지
- FR-SW-010: env 기반 docs 노출 제어 계약 준수
- NFR-SW-001~003: 회귀 방지/기동 정책/오류 노출 기준 반영
- TR-SW-001~005: docs endpoint/노출제어/env 조합/재현성 테스트 보장

## Risks and Mitigations

- 리스크: 현재 DTO/Zod 조합과 Swagger 스키마 간 표현 불일치
  완화: 우선 핵심 응답 계약부터 명시하고 통합 테스트로 drift 감지
- 리스크: 운영 환경 문서 노출로 인한 보안 우려
  완화: env 플래그 기반 비활성/보호를 기본값으로 설정
- 리스크: 문서 관리 누락으로 실제 API와 드리프트
  완화: 스모크 테스트에 OpenAPI endpoint 검증 추가

## Exit Criteria

- Swagger UI + OpenAPI JSON endpoint 동작
- auth/user 주요 엔드포인트 문서화 완료
- 성공/실패 envelope 문서 계약 반영 완료
- production 문서 노출 제어 정책 적용(`API_DOCS_ENABLED`, `API_DOCS_PROTECTED`)
- 문서화 관련 테스트(TR-SW-001~005) 통과
- spec/plan/tasks 문서 작성 완료
