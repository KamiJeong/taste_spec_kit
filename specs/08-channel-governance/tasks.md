Tech-Stack: specs/00-tech-stack.md

# Tasks: Channel Governance

## Phase 1: Data & Contracts (P1)

- [ ] CH-T001 채널/멤버/가입요청/정렬 테이블 스키마 설계
- [ ] CH-T002 Drizzle migration 추가 및 롤백 검증
- [ ] CH-T003 테이블 제약조건/인덱스(중복 pending 요청 방지 포함) 반영
- [ ] CH-T004 API request/response zod schema 정의

## Phase 2: Core Domain Logic (P1)

- [ ] CH-T005 채널 생성 서비스 구현(유저당 10개 제한)
- [ ] CH-T006 역할 판별(owner/manager/member) 유틸 구현
- [ ] CH-T007 가입 요청 생성 서비스 구현(자동가입 금지, 중복요청 차단)
- [ ] CH-T008 가입 승인/거절 서비스 구현(owner/manager 권한 강제)
- [ ] CH-T009 매니저 추가/제거 서비스 구현(owner 전용)
- [ ] CH-T010 강퇴 서비스 구현(owner/manager 규칙 반영)
- [ ] CH-T011 탈퇴 서비스 구현(member quit, owner 탈퇴 제한)
- [ ] CH-T012 소유권 이전 서비스 구현(owner -> target member)

## Phase 3: API Wiring (P1)

- [ ] CH-T013 channel controller 엔드포인트 추가
- [ ] CH-T014 인증/세션/CSRF 정책 정합성 적용
- [ ] CH-T015 에러 코드/응답 envelope 정합성 맞춤
- [ ] CH-T016 Swagger/OpenAPI 문서화 반영

## Phase 4: Ordering (P2)

- [ ] CH-T017 owner 채널 관리 순서 변경 API 구현(DnD 저장)
- [ ] CH-T018 사용자 개인 채널 리스트 순서 변경 API 구현(DnD 저장)
- [ ] CH-T019 reorder 입력 유효성/원자성 보장 처리

## Phase 5: Limits, Audit, Reliability (P2)

- [ ] CH-T020 가입 채널 수 상한 200 강제 및 설정화 구현
- [ ] CH-T021 승인/거절/강퇴/권한변경/소유권이전 감사 로그 연계
- [ ] CH-T022 join request/approval rate limit 정책 반영
- [ ] CH-T023 동시성 충돌 시나리오 처리(트랜잭션/조건부 업데이트)

## Phase 6: Verification (P2)

- [ ] CH-T024 단위 테스트(권한/제한/경계조건)
- [ ] CH-T025 통합 테스트(가입요청~승인, 강퇴, 탈퇴, 소유권이전, reorder)
- [ ] CH-T026 회귀 테스트(기존 auth/user 기능 영향 없음 확인)
- [ ] CH-T027 spec/plan/tasks 동기화 및 체크리스트 검토

## Requirement Mapping

- [ ] CH-T028 FR-CH-001~004 매핑 점검(생성/소유/매니저 관리)
- [ ] CH-T029 FR-CH-005~010 매핑 점검(가입승인/강퇴/탈퇴)
- [ ] CH-T030 FR-CH-011~012 매핑 점검(두 종류 reorder)
- [ ] CH-T031 FR-CH-013~016 + NFR 항목 점검(제한/감사/권한경계/일관성)

## Done Checklist

- [ ] 채널 생성 10개 제한 서버 강제 완료
- [ ] 승인 전 자동 가입 차단 완료
- [ ] owner/manager/member 권한 경계 검증 완료
- [ ] 소유권 이전/owner 탈퇴 규칙 검증 완료
- [ ] DnD 정렬 영속화 검증 완료
- [ ] 감사 로그 및 핵심 테스트 통과
