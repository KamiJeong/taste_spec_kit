Tech-Stack: specs/00-tech-stack.md

# Feature Specification: GitHub Coverage Reporting

**Feature Branch**: `feature/github-coverage-reporting`  
**Created**: 2026-03-05  
**Status**: Draft  
**Input**: "show test coverage on GitHub"

## Summary

웹/디자인시스템 테스트의 코드 커버리지를 CI에서 생성하고, GitHub Actions에서 바로 확인 가능하게 한다.

## Scope

### In Scope

- `web-ci.yml` 및 `design-system-ci.yml`에 coverage 실행 단계 추가
- Vitest coverage 리포트(`lcov`, `json-summary`, `text`) 생성
- GitHub Actions Job Summary에 coverage 수치 표시
- coverage 산출물 업로드(`actions/upload-artifact`)
- Telegram Bot으로 coverage 결과 알림 전송(옵션: 시크릿 설정 시)

### Out of Scope

- 백엔드(ts-node 기반) 테스트 커버리지 도입
- 외부 SaaS(Codecov/Coveralls) 연동
- 커버리지 임계치(threshold) 강제

## Functional Requirements

- **FR-COV-001**: web 테스트 단계는 coverage 리포트를 생성해야 한다.
- **FR-COV-002**: design-system 테스트 단계는 coverage 리포트를 생성해야 한다.
- **FR-COV-003**: 각 워크플로우는 Job Summary에 coverage %를 표시해야 한다.
- **FR-COV-004**: 각 워크플로우는 coverage 결과 파일을 artifact로 업로드해야 한다.
- **FR-COV-005**: 변경 감지 결과가 false인 경우 기존 skip 동작을 유지해야 한다.
- **FR-COV-006**: TELEGRAM 시크릿이 설정된 경우 coverage 요약을 Telegram으로 전송해야 한다.

## Non-Functional Requirements

- **NFR-COV-001**: 기존 테스트 성공/실패 판정 로직과 충돌하지 않아야 한다.
- **NFR-COV-002**: CI 실행 시간 증가를 최소화해야 한다.
- **NFR-COV-003**: Node 22 + pnpm 워크스페이스 환경과 정합성을 유지해야 한다.

## Success Criteria

- **SC-COV-001**: PR에서 web/design-system CI 실행 시 coverage 수치가 Job Summary에 표시된다.
- **SC-COV-002**: PR 실행 결과에서 coverage artifact 다운로드가 가능하다.
- **SC-COV-003**: 기존 web/design-system CI 체크가 정상 통과한다.
- **SC-COV-004**: TELEGRAM 시크릿 설정 시 coverage 알림 메시지가 전송된다.
