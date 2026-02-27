Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: Codex Health Check

**Branch**: `feature/codex-health-check` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/06-codex-health-check/spec.md`

## Summary

Codex issue intake/triage/notify 파이프라인의 핵심 설정 drift를 조기에 탐지하기 위한 진단 워크플로우를 추가한다.

## Technical Context

- **Platform**: GitHub Actions
- **Trigger**:
  - `workflow_dispatch`
  - `schedule` (daily)
- **Validation Method**: shell 기반 정적 규칙 검증 (`grep`, 파일 존재 확인)

## Phases

1. 워크플로우 골격 추가(수동/스케줄)
2. 필수 파일 존재 검증
3. form/workflow/label/policy 핵심 규칙 검증
4. 스펙 문서화 및 운영 반영

## Risks and Mitigations

- 리스크: 문자열 기반 검증의 취약성
  완화: 운영 중 false positive 발생 시 규칙 세분화
- 리스크: 검증 범위 과소
  완화: 신규 Codex 자동화 추가 시 health-check 규칙 동기화 의무화

## Exit Criteria

- health-check workflow 추가 완료
- spec/plan/tasks 문서 추가 완료
- 수동 실행 기준 통과 확인(리포에서 1회)
