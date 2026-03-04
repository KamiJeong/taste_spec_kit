Tech-Stack: specs/00-tech-stack.md

# Tasks: Channel Posts

## Phase 1: Data & Contracts (P1)

- [x] CP-T001 `channel_post` 스키마 설계 및 Drizzle 반영
- [x] CP-T002 migration 작성/적용/검증
- [x] CP-T002A data-model 문서 작성 및 SSOT 동기화
- [x] CP-T003 zod request/response schema 정의
- [x] CP-T004 error code 및 contract 반영

## Phase 2: Core Domain Logic (P1)

- [x] CP-T005 게시글 생성 서비스 구현(owner/manager 전용)
- [x] CP-T006 게시글 목록/상세 조회 서비스 구현(멤버 전용)
- [x] CP-T007 게시글 수정 서비스 구현(owner/manager 전용)
- [x] CP-T008 게시글 삭제 서비스 구현(soft delete)
- [x] CP-T009 권한 판별 유틸/가드 정리
- [x] CP-T010 cursor pagination 로직 구현

## Phase 3: API Wiring (P1)

- [x] CP-T011 channel-post controller 엔드포인트 추가
- [x] CP-T012 인증/세션/CSRF 정책 정합성 적용
- [x] CP-T013 Swagger/OpenAPI 문서화 반영

## Phase 4: Reliability & Audit (P2)

- [x] CP-T014 감사 로그 연계(create/update/delete)
- [x] CP-T015 동시 수정 충돌 방지 전략 반영(updatedAt 조건 등)
- [x] CP-T016 soft delete 조회 누락 방지 및 인덱스 점검

## Phase 5: Verification (P2)

- [x] CP-T017 단위 테스트(권한/페이지네이션/경계조건)
- [x] CP-T018 통합 테스트(CRUD + 권한 + 감사 로그)
- [x] CP-T019 회귀 테스트(기존 channel/auth 기능 영향 없음)
- [x] CP-T020 spec/plan/tasks 동기화 검증

## Requirement Mapping

- [x] CP-T021 FR-CP-001~004 매핑 점검(작성/수정/삭제)
- [x] CP-T022 FR-CP-005~006 매핑 점검(조회권한/페이지네이션)
- [x] CP-T023 FR-CP-007~009 + NFR 매핑 점검(감사로그/soft delete/동시성/보안)

## Done Checklist

- [x] owner/manager 작성/수정/삭제 권한 강제 완료
- [x] member 조회 + 비멤버 차단 완료
- [x] cursor pagination 동작 검증 완료
- [x] soft delete 정책 검증 완료
- [x] 수정 동시성 충돌(409) 검증 완료
- [x] 감사 로그 및 핵심 테스트 통과
