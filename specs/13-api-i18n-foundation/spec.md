Tech-Stack: specs/00-tech-stack.md

# Feature Specification: API Error i18n Foundation

**Feature Branch**: `feature/api-error-i18n-foundation`  
**Created**: 2026-03-09  
**Status**: Completed  
**Input**: "current api sending error message is korean. we need think about i18n"

## Summary

REST/GraphQL의 에러 메시지와 REST 성공 메시지를 locale 기반으로 반환할 수 있는 i18n foundation을 추가한다.
구현 기준 라이브러리는 `nestjs-i18n`을 사용한다.

## Scope

### In Scope

- locale 파싱(`Accept-Language`) 기본 처리
- 에러 코드 기반 메시지 번역 카탈로그(ko/en)
- 성공 코드 기반 메시지 번역 카탈로그(ko/en)
- REST 에러 응답 메시지 자동 localize foundation
- REST 성공 응답 메시지(`data.message`) localize foundation
- GraphQL 에러 메시지 localize foundation
- 최소 1개 이상 실제 경로에서 동작 검증

### Out of Scope

- 전체 다국어 컨텐츠 시스템 도입
- 사용자 저장 locale preference DB 설계
- 사용자 저장 locale preference DB 설계

## Functional Requirements

- **FR-I18N-001**: 서버는 요청 locale를 해석할 수 있어야 한다.
- **FR-I18N-002**: 에러 응답은 기존 `code`를 유지하고 `message`만 locale에 맞게 변환해야 한다.
- **FR-I18N-003**: locale 미지원 시 기본 locale(`en`)로 fallback 해야 한다.
- **FR-I18N-004**: GraphQL 에러도 동일한 code/message 정책을 따라야 한다.
- **FR-I18N-005**: 에러 메시지 카탈로그는 초기에는 중앙(`shared/i18n`)에서 관리하고, 규모 증가 시 도메인 파일 분리(auth/user/channel/common) 전략을 지원해야 한다.
- **FR-I18N-006**: 지원 locale 목록과 기본 locale은 설정값(`API_I18N_SUPPORTED`, `API_I18N_DEFAULT`)으로 관리되어야 한다.
- **FR-I18N-007**: i18n 구현은 `nestjs-i18n` 모듈/번역 리소스를 사용해야 한다.
- **FR-I18N-008**: REST 성공 응답에서 `data.message`가 코드값(예: `AUTH_PASSWORD_CHANGED`)일 때 locale 기반으로 변환되어야 한다.

## Non-Functional Requirements

- **NFR-I18N-001**: 기존 API 계약(code/details/meta)은 깨지지 않아야 한다.
- **NFR-I18N-002**: 클라이언트 검증 기준은 `message`가 아닌 `code` 중심이어야 한다.
- **NFR-I18N-003**: 성공 메시지 역시 클라이언트 분기 로직이 아닌 표시용 텍스트로 취급해야 한다.

## Success Criteria

- **SC-I18N-001**: `Accept-Language: en` 요청에서 주요 에러 메시지가 영어로 반환된다.
- **SC-I18N-002**: `Accept-Language: ko` 요청은 한국어 메시지를 반환하고, 미지정 요청은 기본 locale(`en`) 메시지를 반환한다.
- **SC-I18N-003**: 기존 테스트가 회귀 없이 통과한다.
- **SC-I18N-004**: 기본 locale 정책이 문서와 구현 모두에서 `en`으로 일치한다.
- **SC-I18N-005**: 최소 1개 REST 성공 응답(`data.message`)이 locale에 따라 영어/한국어로 변환된다.
