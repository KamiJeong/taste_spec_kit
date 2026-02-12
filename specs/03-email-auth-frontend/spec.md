# Feature Specification: Email Auth User Management (Frontend)

**Feature Branch**: `spec/03-email-auth-frontend`  
**Created**: 2026-02-12  
**Status**: Draft  
**Input**: Backend 계약(`specs/02-email-auth-backend`) 기반 UI/UX 범위 분리

## Scope

이 스펙은 클라이언트 측 인증/회원관리 UX만 다룬다.

- 포함: 로그인/회원가입/비밀번호 재설정/프로필/계정설정 화면, 폼 검증 UX, 라우트 보호
- 포함: API 호출 어댑터, 인증 상태관리, 에러/성공 상태 표시
- 제외: DB 스키마, 토큰 생성, 세션 저장, 메일 큐 처리

## User Stories

### US-FE-1 (P1): 회원가입/이메일 인증 화면
- 회원가입 폼 입력, 실시간 유효성 검증
- 이메일 인증 링크 결과 화면 처리

### US-FE-2 (P1): 로그인/로그아웃 및 보호 라우트
- 로그인 폼, 세션 유지 UX
- 미인증 사용자의 보호 페이지 접근 차단

### US-FE-3 (P2): 비밀번호 재설정 화면
- 비밀번호 찾기 요청
- 토큰 기반 비밀번호 재설정

### US-FE-4 (P2): 프로필 조회/수정 화면
- 프로필 폼 표시/수정
- 이메일 변경 시 재인증 안내 UX

### US-FE-5 (P3): 계정 비활성화/삭제 요청 화면
- 경고/확인 UX
- 예약 삭제 상태 표시

## Functional Requirements

- FR-FE-001: 모든 인증 폼은 react-hook-form + Zod 기반 검증 제공
- FR-FE-002: API 실패 시 사용자 친화적 에러 메시지 표시
- FR-FE-003: 로딩/성공/실패 상태를 화면에서 명확히 구분
- FR-FE-004: 인증 상태 기반 보호 라우팅 적용
- FR-FE-005: 백엔드 계약 변경 없이 클라이언트만 독립 개선 가능 구조

## Non-Functional Requirements

- NFR-FE-001: 모바일/데스크톱 반응형 지원
- NFR-FE-002: 주요 인증 플로우 접근성(키보드/라벨) 준수
- NFR-FE-003: 네트워크 오류 시 재시도/복구 동선 제공

## Out of Scope

- 백엔드 엔드포인트/도메인 규칙 변경
- 인증 토큰 및 세션 저장 로직의 서버 구현

## Dependencies

- 선행 스펙: `specs/02-email-auth-backend/spec.md`
- 기존 통합본: `specs/02-email-auth-user-management/spec.md`

