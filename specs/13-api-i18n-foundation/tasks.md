Tech-Stack: specs/00-tech-stack.md

# Tasks: API i18n Foundation

## Phase 1: Spec Kit Docs

- [x] I18N-T001 `spec.md` 작성
- [x] I18N-T002 `plan.md` 작성
- [x] I18N-T003 `tasks.md` 작성

## Phase 2: Foundation

- [x] I18N-T004 locale resolver 유틸 추가 (`Accept-Language` 파싱)
- [x] I18N-T005 에러 코드 번역 사전 추가 (ko/en)
- [x] I18N-T015 성공 코드 번역 사전 추가 (ko/en)
- [x] I18N-T006 에러 envelope localizer 추가
- [x] I18N-T016 성공 envelope localizer 추가 (`success.data.message`)
- [x] I18N-T011 기본 locale `en` 정책을 코드/문서에 명시 및 검증
- [x] I18N-T012 에러 메시지 카탈로그 운영 정책 정의(중앙관리 + 도메인 분리 확장 규칙)
- [x] I18N-T013 locale 설정값 관리(`API_I18N_SUPPORTED`, `API_I18N_DEFAULT`) 반영
- [x] I18N-T014 `nestjs-i18n` 의존성/모듈 설정 및 번역 리소스 구성
- [x] I18N-T017 서비스 성공 메시지 하드코딩 제거 및 `SUCCESS_CODES` 적용

## Phase 3: Runtime Wiring

- [x] I18N-T007 REST 에러 응답 자동 localize middleware 적용
- [x] I18N-T018 REST 성공 응답 자동 localize middleware 적용
- [x] I18N-T008 GraphQL error 변환/guard localize 적용

## Phase 4: Verification

- [x] I18N-T009 최소 1개 REST/GraphQL 경로 영어 에러 메시지 검증
- [x] I18N-T019 최소 1개 REST 성공 응답 locale 검증(en/ko)
- [x] I18N-T010 기존 테스트 회귀 확인(현재 범위: `typecheck`, `test:unit`, i18n integration)
