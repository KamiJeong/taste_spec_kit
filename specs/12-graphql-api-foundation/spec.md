Tech-Stack: specs/00-tech-stack.md

# Feature Specification: GraphQL API Foundation

**Feature Branch**: `feature/graphql-api-foundation`  
**Created**: 2026-03-05  
**Status**: In Review  
**Input**: "api service에 graphql을 도입하고 싶다"

## Summary

기존 REST API를 유지하면서, 선택된 도메인에 대해 GraphQL 진입점을 병행 제공하는 foundation을 구축한다.

## Scope

### In Scope

- NestJS GraphQL(code-first) 기반 인프라 초기 설정
- `/graphql` 엔드포인트 및 스키마 생성 파이프라인 구성
- `API_GRAPHQL_ENABLED` 기반 GraphQL surface on/off (kill switch)
- 기존 서비스 레이어 재사용 방식으로 최소 Query/Mutation 추가
- 인증/권한 가드 재사용(REST와 동등 보안)
- Mutation CSRF 보호 정책 정렬(`x-csrf-token` + `csrfToken` cookie)
- resolver 공통 유틸/타입 분리로 중복 제거
- 테스트(기본 스모크 + 권한 검증) 추가

### Out of Scope

- REST API 전체 대체
- 모든 도메인의 GraphQL 전환
- 실시간 Subscription 도입

## Functional Requirements

- **FR-GQL-001**: 서버는 GraphQL 엔드포인트(`/graphql`)를 제공해야 한다.
- **FR-GQL-001A**: `API_GRAPHQL_ENABLED=false`일 때 `/graphql` 및 `/graphql/ui` 라우트가 등록되지 않아야 한다.
- **FR-GQL-002**: GraphQL resolver는 기존 service/persistence 로직을 재사용해야 한다.
- **FR-GQL-003**: 최소 1개 Query와 1개 Mutation을 제공해야 한다.
- **FR-GQL-004**: 인증/권한 정책은 기존 REST 정책과 동등해야 한다.
- **FR-GQL-005**: 운영 환경에서 introspection/playground 정책을 제어할 수 있어야 한다.
- **FR-GQL-006**: GraphQL Mutation은 REST와 동일한 CSRF 정책을 적용해야 한다.

## Non-Functional Requirements

- **NFR-GQL-001**: 기존 REST 엔드포인트 동작에 회귀를 만들지 않아야 한다.
- **NFR-GQL-002**: GraphQL 요청은 request-id, 감사/보안 기준과 정합성을 유지해야 한다.
- **NFR-GQL-003**: 쿼리 복잡도 제한(depth/complexity) 전략을 문서화해야 한다.
- **NFR-GQL-004**: resolver 파일은 wiring 중심으로 유지하고, GraphQL 타입/공통 유틸은 별도 파일로 관리해야 한다.

## Current Surface

- Query:
  - `myChannels`
  - `channelPosts(channelId, cursor, limit)`
  - `me`
  - `myProfile`
- Mutation:
  - `createChannel(name)`
  - `createChannelPost(channelId, title, content)`

## Success Criteria

- **SC-GQL-001**: `/graphql`로 기본 Query/Mutation이 성공적으로 동작한다.
- **SC-GQL-002**: 권한 실패 케이스가 REST와 동일하게 차단된다.
- **SC-GQL-002A**: Mutation CSRF 실패 케이스가 REST와 동일하게 차단된다.
- **SC-GQL-003**: 기존 REST 테스트 스위트가 계속 통과한다.
- **SC-GQL-004**: `API_GRAPHQL_ENABLED=false`에서 GraphQL 엔드포인트가 외부에 노출되지 않는다.
