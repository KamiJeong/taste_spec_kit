Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Channel Posts

**Branch**: `feature/channel-posts` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/09-channel-posts/spec.md`

## Overview

기존 채널 거버넌스 모델을 재사용해 채널 게시글 기능을 추가한다.

- owner/manager 작성/수정/삭제
- member 조회
- 채널 멤버십 기반 접근 제어
- cursor pagination
- audit log 연계

## Tech Stack Alignment

- Backend: NestJS + TypeScript strict
- Validation: Zod
- DB: PostgreSQL + Drizzle ORM
- API: REST

`specs/00-tech-stack.md`와 충돌 없음.

## Architecture

- `apps/api/src/modules/channel-post/`
  - `channel-post.controller.ts`
  - `channel-post.service.ts`
  - `channel-post.schemas.ts`
  - `dto/*`
- Persistence
  - `channel_post` 테이블 + 인덱스
  - `PersistenceService`에 post CRUD + pagination 쿼리 추가

Schema SSOT:
- [data-model.md](./data-model.md)

## Permission Strategy

- 멤버십 확인: `channel_member` 존재 여부
- 변경 권한: actor role이 owner/manager인지 확인
- 조회 권한: actor role이 owner/manager/member 중 하나인지 확인
- 변경 범위: owner/manager는 채널 내 모든 게시글 변경 가능

## Pagination Strategy

- `created_at DESC, id DESC` 정렬
- cursor는 `(created_at, id)` 조합 기반 인코딩
- `limit` 기본 20, 최대 50
- soft delete(`deleted_at is null`) 필터를 항상 포함

## Data & Migration

- `channel_post` 테이블 생성
- 인덱스:
  - `(channel_id, created_at desc, id desc)` 목록 조회용
  - `(author_user_id, created_at desc)` 운영 분석용
  - `(channel_id, deleted_at)` soft delete 필터 보조

## Risks & Mitigations

- 권한 누락 위험: 서비스 레이어 단일 권한 함수로 강제
- 대량 데이터 목록 성능: 복합 인덱스 + 제한된 limit
- 삭제 처리 혼선: soft delete 규칙 일관 적용(`deleted_at` not null 제외 조회)
- 동시 수정 충돌: `ifUpdatedAt` 비교 기반 조건부 update로 409 반환

## Test Strategy

- Unit
  - 권한 규칙(owner/manager/member/non-member)
  - pagination cursor 경계
  - optimistic concurrency 충돌 케이스
- Integration
  - 생성 -> 목록 -> 상세 -> 수정 -> 삭제 흐름
  - 비멤버 조회/변경 차단
  - 감사 로그 생성 검증
- Regression
  - 기존 channel/auth 플로우 영향 없음 확인

## Delivery Phases

1. Schema/migration + persistence
2. Service rules + validation
3. Controller wiring + swagger
4. Tests + spec sync
