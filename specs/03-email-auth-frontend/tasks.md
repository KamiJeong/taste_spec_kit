Tech-Stack: specs/00-tech-stack.md

# Tasks: Email Auth User Management (Frontend)

## Execution Rule

- 공용 계약 패키지 빌드(`@packages/contracts-auth`) 후 frontend typecheck/test를 실행한다.
- 라이브러리/버전 선택 및 업그레이드는 `specs/00-tech-stack.md`를 단일 기준으로 따른다.

## Phase 1: Auth UI Baseline

- [ ] FE-T001 회원가입/로그인/인증결과 페이지 라우트 정리
- [ ] FE-T002 공통 AuthForm 레이아웃/에러 표시 패턴 정의
- [ ] FE-T003 API 클라이언트 에러 매핑 규칙 정의
- [ ] FE-T014 API Envelope 파싱 규칙 구현 (`success.data/meta`, `error.code/message/details`) (FR-FE-011)
- [ ] FE-T015 `X-Request-Id` 클라이언트 로그 컨텍스트 보존 처리 (FR-FE-011)

## Phase 2: P1 Flows

- [ ] FE-T004 SignupForm 구현 (실시간 유효성 검사 포함)
- [ ] FE-T005 LoginForm 구현 (로딩/실패/재시도 UX 포함)
- [ ] FE-T006 보호 라우트 미들웨어/가드 적용
- [ ] FE-T007 로그인 상태 동기화(`me`) 및 로그아웃 UX 구현

## Phase 3: P2 Flows

- [ ] FE-T008 ForgotPasswordForm / ResetPasswordForm 구현
- [ ] FE-T009 ProfileForm / ChangePasswordForm 구현
- [ ] FE-T010 이메일 변경 재인증 안내/상태 표시

## Phase 4: P3 & Polish

- [ ] FE-T011 계정 비활성화/삭제 요청 UX 구현
- [ ] FE-T012 접근성(레이블, 포커스, 키보드) 점검
- [ ] FE-T013 모바일 대응 및 E2E 핵심 시나리오 점검

## Phase 5: Contract Safety & Validation

- [ ] FE-T016 공용 계약 타입 선언(`dist/*.d.ts`) 기반 어댑터 타입 검증 (FR-FE-010)
- [ ] FE-T017 API 어댑터 테스트 추가 (성공/실패 envelope 파싱, `X-Request-Id` 보존) (TR-FE-007)
- [ ] FE-T018 CI/typecheck 선행 빌드 보장 (`@packages/contracts-auth build`) (TR-FE-006)

## Done Checklist

- [ ] FR-FE-001~011 커버
- [ ] TR-FE-001~007 충족
- [ ] `spec.md`의 API Envelope Consumption Rules 준수
