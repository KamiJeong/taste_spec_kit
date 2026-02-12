# pnpm 설치 및 로컬 개발 가이드

이 문서는 프로젝트에서 `pnpm`을 사용하도록 설정하는 방법과 권장 로컬 개발 설정을 설명합니다.

요약:
- 패키지 매니저: pnpm `^8.6.0` (문서 전반에 사용됨)
- Node.js 런타임: `22.x LTS` (프로젝트 `specs/00-tech-stack.md` 기준)

---

## 1) 시스템에 pnpm 설치

Windows (PowerShell) 권장 절차:

1) Node.js 22 LTS 설치 (권장: nvm 사용)
```powershell
# nvm 설치 후 (Windows용 nvm-windows를 사용한다면 해당 설치 방법을 따르세요)
# 예: nvm install 22.16.0; nvm use 22.16.0
```

2) pnpm 전역 설치
```powershell
npm install -g pnpm@^8.6.0
```

확인:
```powershell
pnpm --version
```

---

## 2) 프로젝트에서 pnpm 사용 (워크스페이스)

이 리포는 Monorepo 구조입니다. 루트에 `pnpm-workspace.yaml` 파일을 두어 워크스페이스를 구성하세요.

예시 `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

루트 `package.json` 예시 스크립트(권장):
```json
{
  "name": "taste_spec_kit",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "type-check": "turbo run type-check",
    "test": "turbo run test"
  }
}
```

각 워크스페이스 패키지(`apps/*`, `packages/*`)는 자체 `package.json`을 갖고 `scripts`를 정의해야 합니다. 예: `apps/api/package.json`:
```json
{
  "name": "apps-api",
  "scripts": {
    "dev": "turbo run dev --filter=api",
    "build": "nest build",
    "start": "node dist/main.js"
  }
}
```

---

## 3) 의존성 설치 및 실행

루트에서 의존성 설치(루트와 모든 워크스페이스에 설치됨):
```powershell
pnpm install
```

개별 워크스페이스에서 커맨드 실행(예: API 개발 서버 실행):
```powershell
cd apps/api
pnpm run dev
```

루트에서 turbo로 전체 개발 서버 실행:
```powershell
pnpm turbo run dev
```

---

## 4) 권장 로컬 설정 파일

- `.nvmrc` 또는 `.node-version`: Node.js 버전 고정 (예: `22` 또는 `22.16.0`)
- `pnpm-workspace.yaml`: 워크스페이스 목록
- `pnpm-lock.yaml`: 자동 생성됨 (커밋 권장)

---

## 5) CI에서의 pnpm 사용 (GitHub Actions 예시)

간단한 workflow snippet:
```yaml
steps:
  - uses: actions/checkout@v4
  - name: Use Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '22'
  - name: Install pnpm
    run: npm install -g pnpm@^8.6.0
  - name: Install dependencies
    run: pnpm install
  - name: Build
    run: pnpm run build
```

---

## 6) 메모 / 가정

- 이 가이드는 `specs/00-tech-stack.md`에서 정의된 Node.js `22.x LTS`와 `pnpm ^8.6.0` 사용을 가정합니다.
- 회사 정책이나 보안 요구사항에 따라 전역 설치 대신 로컬 pnpm wrapper를 권장할 수 있습니다.

필요하면 Windows 전용 nvm/nvm-windows 설치 가이드를 추가로 작성해 드리겠습니다.

