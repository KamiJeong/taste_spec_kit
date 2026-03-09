Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: API i18n Foundation

**Branch**: `feature/api-i18n-foundation` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/13-api-i18n-foundation/spec.md`

## Overview

에러/성공 메시지 i18n을 코드 중심 계약을 유지하는 방식으로 도입한다.
구현은 `nestjs-i18n` 기반으로 구성한다.

핵심 전략:
- `code`는 불변 계약으로 유지
- `message`만 locale 기반으로 렌더링
- 성공 응답은 `data.message`에 코드값을 저장하고 edge에서 locale 텍스트로 렌더링
- 도메인 서비스의 기존 failure 생성 코드는 유지하고 edge에서 번역 적용
- 기본 locale은 `en`, `Accept-Language`로 locale 선택, 미지원 언어는 `en` fallback
- 지원 locale/기본 locale은 환경변수(`API_I18N_SUPPORTED`, `API_I18N_DEFAULT`)로 관리

## Proposed Architecture

- `apps/api/src/modules/shared/i18n/`
  - `locale.ts`: locale 파싱/정규화
  - `error-messages.ts`: code -> `nestjs-i18n` translation key(`errors.<CODE>`) 변환
  - `success-messages.ts`: code -> `nestjs-i18n` translation key(`success.<CODE>`) 변환
  - `localize-error.ts`: 에러/성공 envelope localize 함수
  - (확장 시) `errors/auth.ts`, `errors/user.ts`, `errors/channel.ts`, `errors/common.ts`로 분리 가능
- `apps/api/src/i18n/`
  - `en/errors.json`
  - `en/success.json`
  - `ko/errors.json`
  - `ko/success.json`
- `apps/api/src/modules/shared/success-codes.ts`
  - 서비스 계층 성공 메시지 코드 상수 집합
- `SharedModule`
  - `I18nModule.forRoot(...)` + `AcceptLanguageResolver` 구성
- REST
  - `main.ts`에 response localization middleware 추가
- GraphQL
  - `graphql/common/graphql-response.ts` 에서 locale-aware error 변환
  - guard/csrf GraphQLError 메시지 i18n 적용

## Testing Strategy

- Unit:
  - locale resolver 동작 검증
  - error/success localizer fallback 검증
- Integration:
  - `Accept-Language: en|ko` 요청 에러/성공 메시지 검증(REST + GraphQL 최소 1개)
- Regression:
  - 기존 GraphQL/REST 단위 테스트 통과
