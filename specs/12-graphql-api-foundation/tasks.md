Tech-Stack: specs/00-tech-stack.md

# Tasks: GraphQL API Foundation

## Phase 1: Spec Kit Docs

- [x] GQL-T001 `spec.md` 작성
- [x] GQL-T002 `plan.md` 작성
- [x] GQL-T003 `tasks.md` 작성

## Phase 2: Foundation Setup

- [x] GQL-T004 GraphQL 의존성 추가 (`@nestjs/graphql`, `@nestjs/apollo`, `graphql`)
- [x] GQL-T005 `GraphQLModule` 초기 설정 및 `/graphql` endpoint wiring
- [x] GQL-T006 env 기반 introspection/playground 제어 옵션 추가

## Phase 3: Domain Surface (MVP)

- [x] GQL-T007 `channel-post` Query resolver 추가 (목록 조회)
- [x] GQL-T008 `channel-post` Mutation resolver 추가 (생성)
- [x] GQL-T009 기존 service/persistence 재사용으로 resolver 연결
- [x] GQL-T016 `channel` GraphQL Query/Mutation 추가 (`myChannels`, `createChannel`)
- [x] GQL-T017 `auth`/`user` GraphQL Query 추가 (`me`, `myProfile`)

## Phase 4: Security & Testing

- [x] GQL-T010 GraphQL auth/role guard 적용
- [x] GQL-T011 GraphQL integration tests 추가 (성공/권한실패)
- [x] GQL-T018 GraphQL kill switch 검증 테스트 추가 (`API_GRAPHQL_ENABLED=false` => `/graphql` 404)
- [ ] GQL-T012 기존 REST regression 테스트 통과 확인

## Phase 5: Documentation & Rollout

- [x] GQL-T013 README/운영 문서에 GraphQL 사용 범위 및 AuthGuard(REST+GraphQL) 정책 명시
- [ ] GQL-T014 complexity/depth 제한 도입 계획 기록
- [x] GQL-T015 GraphQL 테스트 템플릿 문서 공유 경로 정리 (`docs/graphql/README.md`, `docs/graphql/test-template.md`, `docs/graphql/manual-test-template.md`)
- [x] GQL-T019 resolver 중복 제거를 위한 GraphQL 공통 유틸/타입 분리 (`modules/graphql/common`, `*/graphql/*.types.ts`)
