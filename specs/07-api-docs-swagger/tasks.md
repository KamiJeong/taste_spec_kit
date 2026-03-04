Tech-Stack: specs/00-tech-stack.md

# Tasks: API Docs with Swagger

## Phase 1: Bootstrap (P1)

- [x] SW-T001 `apps/api`에 Swagger 의존성 추가(`@nestjs/swagger` + 필요 peer)
- [x] SW-T002 `apps/api/src/main.ts`에 OpenAPI Document/Swagger UI 부트스트랩 추가
- [x] SW-T003 문서 경로(`/api/docs`, `/api-json`) 고정 및 기본 메타데이터 설정
- [x] SW-T004 docs 노출 제어용 env 변수 명세 및 로더 반영(`API_DOCS_ENABLED`, `API_DOCS_PROTECTED`, `apps/api/.env.template`)

## Phase 2: Contract Coverage (P1)

- [x] SW-T005 Auth 컨트롤러 8개 엔드포인트 문서 데코레이터 적용
- [x] SW-T006 User 컨트롤러 6개 엔드포인트 문서 데코레이터 적용
- [x] SW-T007 성공/실패 Envelope 및 공통 에러 응답 스키마 반영
- [x] SW-T008 인증 필요 엔드포인트에 cookie auth + `x-csrf-token` 요구 문서 반영

## Phase 3: Runtime Policy (P2)

- [x] SW-T009 production 환경 문서 노출 제어(env flag) 구현
- [x] SW-T010 문서 노출 제어 동작 검증 테스트 추가(env flag 조합 포함)

## Phase 4: Verification (P2)

- [x] SW-T011 `/api/docs` 렌더링 스모크 테스트 추가
- [x] SW-T012 `/api-json` 스키마 검증 테스트 추가
- [x] SW-T013 Spec Kit 문서 정합성 리뷰(spec/plan/tasks + tech-stack 참조)

## Requirement Mapping

- [x] SW-T014 FR-SW-001/002/006 충족 여부 점검(부트스트랩 + endpoint)
- [x] SW-T015 FR-SW-003/004/005 충족 여부 점검(route coverage + envelope + security docs)
- [x] SW-T016 FR-SW-007/008/009 충족 여부 점검(prod 제어 + 스택 정합성 + 문서 규칙)
- [x] SW-T017 NFR-SW-001~003 충족 여부 점검(회귀/기동정책/오류노출)
- [x] SW-T018 TR-SW-001~005 충족 여부 점검(테스트 재현성 포함)
- [x] SW-T019 FR-SW-010 충족 여부 점검(env 계약 준수)

## Done Checklist

- [x] FR-SW-001~010 반영
- [x] NFR-SW-001~003 반영
- [x] TR-SW-001~005 반영
- [x] 로컬 실행 기준 Swagger UI/OpenAPI JSON 검증 완료
- [x] production 노출 제어 검증 완료
