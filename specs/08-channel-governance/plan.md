Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Channel Governance

**Branch**: `feature/channel-governance` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/08-channel-governance/spec.md`

## Overview

NestJS API(`apps/api`) 기준으로 채널 거버넌스 도메인을 추가한다.

- 채널 생성 제한(유저당 10개)
- 가입 채널 수 제한(유저당 200)
- 승인 기반 가입 요청 플로우
- owner/manager/member 권한 모델
- 소유권 이전
- 강퇴/탈퇴
- owner 관리순서 + 사용자 개인순서 DnD 저장

## Tech Stack Alignment

- Backend: NestJS + TypeScript strict
- Validation: Zod
- DB: PostgreSQL + Drizzle ORM
- Cache/Session: Redis (기존 인증 문맥 재사용)
- API 스타일: REST

`specs/00-tech-stack.md`와 충돌하는 신규 스택 도입 없음.

## Architecture & Modules

- `apps/api/src/modules/channel/`
  - `channel.controller.ts`
  - `channel.service.ts`
  - `channel.schemas.ts`
  - `dto/*`
- Persistence
  - `channel` / `channel_member` / `channel_join_request` / `user_channel_order` 테이블
  - 필요한 인덱스와 unique 제약
- Shared
  - 권한/에러 응답 유틸 재사용
  - 감사 로그 모듈 연계

Schema SSOT:
- [data-model.md](./data-model.md)

## Permission Enforcement Strategy

- 서버 권한 체크를 서비스 레이어에서 최종 강제
- owner/manager/member 역할을 `channel_member.role`로 일관 처리
- 승인/강퇴/권한변경 액션은 actor 검증 후 처리
- 강퇴 규칙: manager -> member만 가능, owner -> manager/member 가능
- owner 탈퇴는 소유권 이전 이후에만 가능

## Join Request Workflow

1. 사용자 가입 요청 생성
2. `pending` 상태 저장
3. owner/manager가 approve/reject 수행
4. approve 시 membership upsert + request 상태 업데이트
5. reject 시 request 상태 업데이트

중복 요청 방지:
- `(channel_id, requester_user_id, status=pending)` 중복 금지 정책 적용

## Ordering Strategy

- Owner reorder: owner가 소유 채널 관리 리스트 정렬 저장
- User reorder: 사용자 개인 채널 리스트 정렬 저장
- API는 "정렬된 channel id 배열"을 입력받아 전체 sort_index 재할당

## Limits & Policy

- 채널 생성: 사용자당 10개 강제
- 가입 채널 수: 사용자당 200 강제(환경 변수로 추후 조정 가능)
- 요청 폭주 방지: join request/create 및 approve/reject에 rate limit 고려

## Risks

- 동시 승인/거절 처리의 race condition
- owner_user_id와 owner membership 불일치 가능성
- 대형 채널의 멤버/요청 목록 성능
- DnD 순서 저장 시 부분 실패/중복 정렬값

## Mitigations

- 트랜잭션 + 조건부 업데이트(`pending` 상태 확인)
- ownership transfer 시 `channel.owner_user_id` + `channel_member.role` 동시 갱신
- 핵심 쿼리 인덱스 추가
- reorder API 원자성 보장

## Test Strategy

- Unit
  - 권한 규칙(owner/manager/member)
  - 제한 규칙(생성 10개, 가입 상한 정책)
- Integration
  - 가입 요청 생성/승인/거절
  - 강퇴/탈퇴
  - reorder 반영
  - 중복/경합 시나리오
- E2E (필요 시)
  - 실제 사용자 플로우 기반 검증

## Delivery Phases

1. Schema & migration
2. Service rules & permission checks
3. Controller API wiring + validation
4. Reorder endpoints
5. Tests + docs sync
