# 기술 스택 명세서 (Tech Stack Specification)

**중요**: 모든 `/speckit` 명령은 이 파일 `specs/00-tech-stack.md`를 반드시 참조해야 합니다. 이 문서는 프로젝트의 SSOT(단일 진실 공급원)입니다.

**프로젝트**: taste_spec_kit  
**버전**: 1.4.1  
**작성일**: 2026-02-09  
**최종 수정일**: 2026-02-24  
**상태**: 활성 (Active)

## 개요

이 문서는 `taste_spec_kit` 프로젝트의 **단일 기준 (Single Source of Truth, SSOT)**으로, 모든 기술 스택 결정을 명시합니다. 모든 프로젝트 구성원은 이 문서를 참조하며, 새로운 기술 도입 시 반드시 이 문서를 업데이트해야 합니다.

## 핵심 원칙

이 기술 스택은 다음 헌법 원칙을 준수합니다:

- **SSOT**: 이 문서가 모든 기술 결정의 단일 출처
- **Pinned-Stack**: 버전 고정으로 재현 가능한 환경 보장
- **Type-Safety**: 가능한 모든 곳에서 타입 안전성 우선
- **Local-First**: 로컬 개발 환경 우선 지원
- **Cost-Aware**: 비용 효율적인 기술 선택

## 기술 스택

### 아키텍처 (Architecture)

- **프로젝트 구조**: Monorepo (모노레포)
- **배포 방식**: Docker Image
- **API 스타일**: REST (기본), GraphQL (선택적 고려)

### Monorepo 구조 (Turborepo 권장)

- 권장 가이드: https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository
- 설명: 위 Turborepo 문서를 참고하여 리포지토리를 구성합니다. Turborepo는 작업(작업공간) 단위를 명확히 분리하고, 파이프라인과 캐싱으로 빌드/테스트 효율을 높입니다.

- 권장 폴더 구조 예시:

```
repo-root/
├── apps/               # 배포 가능한 애플리케이션 (예: api, web)
├── packages/           # 재사용 가능한 라이브러리(@repo/* - types, ui, validators, database 등)
├── tooling/            # 빌드/스크립트/자동화 도구
├── .github/            # CI/CD 워크플로우
├── pnpm-workspace.yaml # pnpm 워크스페이스 설정
├── turbo.json          # Turborepo 파이프라인 설정
└── package.json        # 루트 워크스페이스 및 공통 스크립트
```

- 권장 관행:
  - 각 `apps/*`와 `packages/*`는 자체 `package.json`과 명확한 `scripts`(build/dev/test/lint)를 가집니다.
  - 루트에 `pnpm-workspace.yaml`과 `turbo.json`을 두어 워크스페이스와 파이프라인을 관리합니다.
  - 내부 패키지는 `@repo/*` 네임스페이스를 사용하여 명확한 의존성을 유지합니다.
  - 공유 패키지(`packages/*`)는 TypeScript source(`src/*.ts`)를 기준으로 유지하고, 앱은 빌드 산출물(`dist/*`)과 선언 파일(`dist/*.d.ts`)을 소비합니다.

### 핵심 언어 (Core Languages)

- **Node.js**: `22.x LTS` (런타임 환경)
- **TypeScript**: `^5.9.0` (프론트엔드 & 백엔드)

### 프론트엔드 (Frontend)

- **Next.js**: `^15.1.0` (풀스택 웹 프레임워크)
- **React**: `^19.0.0` (UI 라이브러리)
- **UI 컴포넌트**: 
  - **shadcn/ui**: `registry latest (CLI/registry 기반)` (컴포넌트 소스)
  - **설치 참고**: https://ui.shadcn.com/docs/components (shadcn/ui 설치/컴포넌트 추가 시 우선 참조)
  - **MCP 설정 참고**: https://ui.shadcn.com/docs/mcp?utm_source=chatgpt.com (Codex/LLM 기반 컴포넌트 워크플로우 연동 시 우선 참조)
  - **Tailwind CSS**: `^4.0.0` (스타일링)
- **스토리북**:
  - **storybook / @storybook/react-vite / @storybook/addon-a11y / @storybook/addon-docs**: `^10.2.0` (10.2.x 라인)
  - **주의**: Storybook 10 라인에서는 `@storybook/addon-essentials` 대신 개별 addon 조합을 사용

### 백엔드 (Backend)

- **NestJS**: `^11.1.0` (Node.js 프레임워크)
- **TypeScript**: `^5.9.0` (타입 안전성)
- **Nodemailer**: `^6.10.1` (SMTP 메일 전송 어댑터)

### 폼 & 검증 (Form & Validation)

- **react-hook-form**: `^7.54.0` (폼 관리)
- **Zod**: `^4.3.0` (스키마 검증)

### 인증 (Authentication)

- **better-auth**: `latest` (인증 라이브러리)

### 데이터베이스 (Database)

- **PostgreSQL**: `16.x` (주 데이터베이스)
- **Redis**: `7.x` (캐시 & 세션 스토어)
- **Drizzle ORM**: `^0.45.0` (TypeScript ORM - 타입 안전 쿼리)

### 개발 도구 (Development Tools)

- **pnpm**: `^10.0.0` (패키지 관리자 & 워크스페이스 지원)
- **ESLint**: `^9.0.0` (린팅)
- **Prettier**: `^3.4.0` (포매팅)
- **Docker**: `27.x` (컨테이너화)
- **Docker Compose**: `2.x` (로컬 오케스트레이션)

### 테스트 (Testing)

- **Playwright**: `^1.49.0` (E2E 테스트 - 우선)
- **Vitest**: `^2.1.0` (단위 테스트 - 선택적)
- **Storybook Test**: 컴포넌트 시각적 테스트

### 타입 체크 (Type Checking)

- **TypeScript Strict Mode**: 활성화 필수
- **Zod**: 런타임 타입 검증

### CI/CD

- **GitHub Actions**: (자동화 워크플로우)

### 문서화 (Documentation)

- **Markdown**: 모든 문서는 `.md` 형식
- **JSDoc/TSDoc**: 코드 내 문서화

### 버전 관리 (Version Control)

- **Git**: `2.x`
- **Conventional Commits**: 커밋 메시지 규칙

## 버전 고정 정책 (Pinned Version Policy)

### 고정 수준 (Pinning Level)

- **최신 안정 버전 우선**: 특별한 이유가 없는 한 최신 stable 버전 사용
- **MAJOR.MINOR.x**: 패치 버전 자동 업데이트 허용 (^5.3.0 형식)
- **latest**: better-auth, shadcn/ui 등 빠르게 발전하는 라이브러리에 한해 사용

### 업데이트 주기

- **주간 검토**: 보안 패치 (Critical)
- **월간 검토**: 마이너 버전 업데이트 및 버그 수정
- **분기별 검토**: 메이저 버전 업그레이드 고려

## 금지 사항 (Prohibited)

다음 사항은 명시적으로 **금지**됩니다:

- ❌ 승인되지 않은 `latest` 태그 무분별 사용
- ❌ 문서화되지 않은 글로벌 패키지 설치
- ❌ 프로젝트별로 다른 Node.js 버전 사용
- ❌ 타입 정의 없이 JavaScript 사용 (`.js` 대신 `.ts` 필수)
- ❌ `any` 타입 무분별한 사용 (정당화 필요)
- ❌ Monorepo 외부에서 패키지 직접 설치 (`pnpm` workspace 사용 필수)

## 새 기술 도입 프로세스

새로운 기술을 도입하려면:

1. **제안서 작성**: `specs/proposals/[기술명]-proposal.md` 생성
2. **헌법 준수 검증**: 8가지 핵심 원칙과의 일치성 확인
3. **비용 분석**: 라이센스, API 호출, 리소스 사용량 평가
4. **승인**: 기술 리더 검토 및 승인
5. **이 문서 업데이트**: 승인 후 즉시 반영
6. **공지**: 팀 전체에 변경 사항 공유

## Spec/Plan/Tasks 연동 규칙 (Mandatory)

- 모든 기능 문서(`spec.md`, `plan.md`, `tasks.md`)는 문서 상단에 `Tech-Stack: specs/00-tech-stack.md`를 명시해야 한다.
- 버전/라이브러리 선택 충돌 시 기능 문서보다 본 문서를 우선한다.
- 구현 도중 스택 변경이 발생하면 먼저 본 문서를 갱신한 뒤 기능 문서(spec/plan/tasks)를 동기화한다.

## Developer Environment Rule (Mandatory)

- 로컬 개발 환경은 `.env.template` 기반으로만 구성한다.
- 로컬 인프라(PostgreSQL/Redis)는 `docker-compose.yml`을 기준으로 실행한다.
- 저장소에는 prod/stage/dev 서버의 실제 계정/비밀번호/토큰/호스트 정보를 커밋하지 않는다.

## 외부 기준 검증 (Version Verification)

- 검증일: 2026-02-11
- Storybook 릴리스 기준: https://github.com/storybookjs/storybook/releases
- Storybook 10.2 라인 안내: https://storybook.js.org/releases/10.2
- npm registry 조회 결과(2026-02-11):
  - `storybook`: `10.2.8`
  - `@storybook/react-vite`: `10.2.8`
  - `@storybook/addon-a11y`: `10.2.8`
  - `@storybook/addon-docs`: `10.2.8`
  - `@storybook/addon-essentials`: `8.6.14` (Storybook 10과 버전 라인 불일치)
- shadcn/ui 기준 문서: https://ui.shadcn.com/docs
- shadcn/ui 설치 참고(components): https://ui.shadcn.com/docs/components
- shadcn/ui MCP 설정 참고: https://ui.shadcn.com/docs/mcp?utm_source=chatgpt.com
- 워크스페이스 lock 기준(2026-02-23):
  - `@nestjs/core`: `11.1.14`
  - `typescript`: `5.9.3`
  - `zod`: `4.3.6`
  - `drizzle-orm`: `0.45.1`
  - `pg`: `8.18.0`
  - `redis`: `5.11.0`
  - `bullmq`: `5.70.1`
  - `better-auth`: `1.4.18`

## 변경 이력 (Change Log)

### 1.4.0 (2026-02-23)

- **변경**: TypeScript 기준을 `^5.9.0`으로 상향
- **변경**: NestJS 기준을 `^11.1.0`으로 상향
- **변경**: Zod 기준을 `^4.3.0`으로 상향
- **변경**: Drizzle ORM 기준을 `^0.45.0`으로 상향
- **변경**: pnpm 기준을 `^10.0.0`으로 상향
- **추가**: `spec/plan/tasks` 문서의 Tech-Stack 참조 의무 규칙
- **추가**: lockfile 기반 버전 스냅샷(2026-02-23)

### 1.4.1 (2026-02-24)

- **추가**: 백엔드 메일 전송 어댑터로 `nodemailer` 기준 추가 (`^6.10.1`)

### 1.3.3 (2026-02-23)

- **추가**: 공유 패키지(`packages/*`) TypeScript-first 규칙 명시
- **정책**: 앱 런타임은 공유 패키지의 빌드 산출물(`dist/*`)과 타입 선언(`dist/*.d.ts`)을 소비

### 1.3.2 (2026-02-12)

- **추가**: shadcn/ui MCP 설정 참조 문서 링크 명시
- **명확화**: Codex/LLM 연동 시 shadcn/ui 공식 MCP 가이드를 우선 기준으로 사용

### 1.3.1 (2026-02-11)

- **정정**: Storybook 기준을 패키지별 실제 npm 배포 라인으로 명시
- **명확화**: Storybook 10 라인에서는 `@storybook/addon-docs` 등 개별 addon 조합을 사용
- **추가**: 외부 기준 검증 섹션에 npm registry 조회 결과 반영

### 1.3.0 (2026-02-11)

- **변경**: Storybook `^8.5.0` → `^10.2.0` (메이저 라인 정렬)
- **명확화**: shadcn/ui는 npm semver 라이브러리보다 registry/CLI 기반 소스 채택 방식으로 관리
- **정책**: `specs/01-design-system` 구현은 Storybook 10.2.x 기준으로 정합성 유지

### 1.2.0 (2026-02-09)

- **추가**: Drizzle ORM `^0.36.0` (TypeScript ORM)
- **변경**: Node.js `20.x` → `22.x LTS` (최신 LTS)
- **변경**: TypeScript `^5.3.0` → `^5.7.0` (최신 안정 버전)
- **변경**: Next.js `^14.0.0` → `^15.1.0` (React 19 지원)
- **변경**: React `^18.0.0` → `^19.0.0` (최신 메이저 버전)
- **변경**: Tailwind CSS `^3.4.0` → `^4.0.0` (성능 개선)
- **변경**: Storybook `^7.6.0` → `^8.5.0` (최신 메이저 버전)
- **변경**: NestJS `^10.0.0` → `^11.0.0` (최신 메이저 버전)
- **변경**: react-hook-form `^7.49.0` → `^7.54.0` (최신 마이너 버전)
- **변경**: Zod `^3.22.0` → `^3.24.0` (최신 마이너 버전)
- **변경**: Playwright `^1.40.0` → `^1.49.0` (최신 마이너 버전)
- **변경**: Vitest `^1.0.0` → `^2.1.0` (최신 메이저 버전)
- **변경**: ESLint `^8.0.0` → `^9.0.0` (최신 메이저 버전)
- **변경**: Prettier `^3.0.0` → `^3.4.0` (최신 마이너 버전)
- **변경**: Docker `24.x` → `27.x` (최신 버전)
- **변경**: 패키지 매니저 `bun` → `pnpm` (정책 복구 — pnpm 사용)
- **정책**: 모든 라이브러리를 최신 안정 버전으로 업데이트

### 1.1.0 (2026-02-09)

- **추가**: shadcn/ui, Storybook (UI 컴포넌트 개발)
- **추가**: react-hook-form, Zod (폼 관리 & 검증)
- **추가**: better-auth (인증)
- **추가**: NestJS (백엔드 프레임워크)
- **추가**: Redis (캐시 & 세션)
- **변경**: Playwright를 E2E 테스트 우선 도구로 변경
- **변경**: Vitest를 선택적 단위 테스트 도구로 변경
- **추가**: GraphQL 선택적 고려 사항 명시
- **추가**: Monorepo 구조 및 Docker 배포 방식 명시
- **변경**: 핵심 언어를 Node.js + TypeScript로 명확화 (Python 제거)
- **정책**: 최신 안정 버전 우선 정책 수립

### 1.0.0 (2026-02-09)

- 초기 기술 스택 문서 생성
- TypeScript, Next.js 기본 스택 정의
- 버전 고정 정책 수립

---

**관련 문서**:

- [프로젝트 헌법](../.specify/memory/constitution.md)
- [명세 템플릿](../.specify/templates/spec-template.md)
- [구현 계획 템플릿](../.specify/templates/plan-template.md)
