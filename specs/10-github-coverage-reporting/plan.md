Tech-Stack: specs/00-tech-stack.md

# Implementation Plan: GitHub Coverage Reporting

**Branch**: `feature/github-coverage-reporting` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/10-github-coverage-reporting/spec.md`

## Overview

Vitest 기반인 web/storybook 테스트에 coverage 출력 옵션을 추가하고, GitHub Actions에서 결과를 요약/아카이브한다.

## Tech Stack Alignment

- CI/CD: GitHub Actions
- Testing: Vitest
- Runtime/Tooling: Node 22 + pnpm workspace

`specs/00-tech-stack.md`와 충돌 없음.

## Architecture

- Package scripts
  - `apps/web/package.json`: `test:coverage` 추가
  - `apps/storybook/package.json`: `test:coverage` 추가
- Workflow
  - `.github/workflows/web-ci.yml`: coverage 실행/요약/artifact 업로드
  - `.github/workflows/design-system-ci.yml`: coverage 실행/요약/artifact 업로드

## Reporting Strategy

- 생성 파일
  - `coverage/coverage-summary.json`
  - `coverage/lcov.info`
- 표시 방식
  - `GITHUB_STEP_SUMMARY`에 Line/Statement/Function/Branch coverage %
- 보존 방식
  - `actions/upload-artifact`로 coverage 디렉터리 업로드

## Risks & Mitigations

- coverage provider 미설치 위험: `@vitest/coverage-v8`를 devDependency로 추가
- 경로/파일 누락 위험: summary 스크립트에서 파일 존재 체크 후 실패 처리
- 실행시간 증가: 기존 test 단계 대체로 중복 실행 방지

## Test Strategy

- 로컬에서 `pnpm --filter @apps/web test:coverage` 실행 확인
- 로컬에서 `pnpm --filter @repo/storybook test:coverage` 실행 확인
- CI workflow YAML 문법 및 조건식 검토

## Delivery Phases

1. spec/plan/tasks 문서 작성
2. coverage 스크립트 및 의존성 추가
3. workflow coverage 단계 추가
4. 로컬 실행 검증
