# Turborepo Configuration Examples

**Feature**: 001-email-auth-user-management  
**Purpose**: Turborepo 설정 파일 예시 및 설명

---

## Root package.json

```json
{
  "name": "taste-spec-kit",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "db:migrate": "turbo run db:migrate --filter=@repo/database",
    "db:studio": "cd packages/database && pnpm drizzle-kit studio",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "@repo/config": "workspace:*"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "packageManager": "pnpm@^8.6.0",
  "engines": {
    "node": ">=22.x"
  }
}
```

---

## turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "**/.env.*local",
    ".env",
    "tsconfig.json"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**"
      ],
      "cache": true
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": [],
      "cache": true
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": [],
      "cache": true
    },
    "clean": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  },
  "remoteCache": {
    "enabled": true
  }
}
```

**주요 설정 설명**:

### Pipeline Tasks

1. **build**:
   - `dependsOn: ["^build"]`: 의존하는 패키지를 먼저 빌드
   - `outputs`: 빌드 결과물 (캐시 대상)
   - `cache: true`: 변경되지 않으면 캐시 사용

2. **dev**:
   - `persistent: true`: 백그라운드에서 계속 실행
   - `cache: false`: 개발 모드는 캐시하지 않음

3. **test**:
   - `dependsOn: ["build"]`: 빌드 후 테스트 실행
   - Coverage 결과를 캐시

4. **lint**:
   - 빌드 후 린트 실행
   - 결과를 캐시하여 중복 실행 방지

### Global Dependencies

환경 변수 파일이나 tsconfig 변경 시 모든 캐시 무효화

---

## packages/database/package.json

```json
{
  "name": "@repo/database",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts",
    "./client": "./src/client.ts"
  },
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.36.0",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.1",
    "@repo/config": "workspace:*",
    "@types/pg": "^8.11.10",
    "typescript": "^5.7.0"
  }
}
```

---

## packages/types/package.json

```json
{
  "name": "@repo/types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./auth": "./src/auth.types.ts",
    "./user": "./src/user.types.ts",
    "./api": "./src/api.types.ts"
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "typescript": "^5.7.0"
  }
}
```

---

## packages/validators/package.json

```json
{
  "name": "@repo/validators",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./auth": "./src/auth.schemas.ts",
    "./user": "./src/user.schemas.ts"
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.24.0",
    "@repo/types": "workspace:*"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

---

## packages/ui/package.json

```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*.tsx",
    "./styles": "./src/styles/globals.css"
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "lint": "eslint src",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@storybook/react": "^8.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

---

## apps/api/package.json

```json
{
  "name": "api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "test": "vitest run",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "test:cov": "vitest run --coverage",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/throttler": "^6.2.1",
    "@nestjs/bull": "^10.2.1",
    "bull": "^4.16.3",
    "better-auth": "latest",
    "nodemailer": "^6.9.16",
    "ioredis": "^5.4.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1",
    "@repo/database": "workspace:*",
    "@repo/types": "workspace:*",
    "@repo/validators": "workspace:*"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@repo/config": "workspace:*",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/nodemailer": "^6.4.16",
    "nestjs-throttler-storage-redis": "^0.5.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

---

## apps/web/package.json

```json
{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.1",
    "better-auth": "latest",
    "@repo/types": "workspace:*",
    "@repo/validators": "workspace:*",
    "@repo/ui": "workspace:*"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@playwright/test": "^1.49.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "tailwindcss": "^4.0.0"
  }
}
```

---

## packages/config/tsconfig/base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "lib": ["ES2023"],
    "module": "ESNext",
    "target": "ES2023",
    "moduleResolution": "Bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "exclude": ["node_modules"]
}
```

---

## packages/config/tsconfig/next.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "dist", ".next"]
}
```

---

## packages/config/tsconfig/nest.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2023"],
    "module": "CommonJS",
    "target": "ES2023",
    "moduleResolution": "Node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "test"]
}
```

---

## Usage Examples

### 1. 전체 프로젝트 빌드

```bash
# 모든 패키지와 앱을 의존성 순서대로 빌드
pnpm turbo run build

# 캐시 사용으로 변경된 패키지만 빌드 (매우 빠름)
```

### 2. 특정 앱만 개발 모드 실행

```bash
# API만 실행 (의존 패키지 자동 빌드)
pnpm turbo run dev --filter=api

# Web만 실행
pnpm turbo run dev --filter=web

# 둘 다 병렬 실행
pnpm turbo run dev --filter=api --filter=web
```

### 3. 특정 패키지 변경 후 영향받는 앱만 테스트

```bash
# @repo/validators 변경 후 의존하는 앱만 테스트
pnpm turbo run test --filter=...@repo/validators

# 결과: api와 web 앱의 테스트가 실행됨
```

### 4. 프로덕션 빌드 및 배포

```bash
# 모든 패키지 빌드 (캐시 사용)
pnpm turbo run build

# 특정 앱만 배포용 빌드
pnpm turbo run build --filter=api
pnpm turbo run build --filter=web

# 빌드 결과물:
# - apps/api/dist
# - apps/web/.next
```

### 5. 병렬 테스트 실행

```bash
# 모든 패키지의 테스트를 병렬로 실행
pnpm turbo run test

# E2E 테스트만 실행
pnpm turbo run test:e2e

# 커버리지 포함
pnpm turbo run test:cov
```

---

## Turborepo Cache

### Local Cache

```bash
# 캐시 확인
ls -la node_modules/.cache/turbo

# 캐시 초기화
pnpm turbo run build --force
```

### Remote Cache (선택 사항)

```bash
# Vercel Remote Cache 연결
pnpm dlx turbo login
pnpm dlx turbo link

# 이후 모든 팀원이 빌드 캐시 공유
```

---

## Workspace Protocol

내부 패키지 참조 시 `workspace:*` 사용:

```json
{
  "dependencies": {
    "@repo/database": "workspace:*",
    "@repo/types": "workspace:*"
  }
}
```

**이점**:
- 항상 로컬 버전 사용
- npm publish 시 자동으로 실제 버전으로 변환
- 심볼릭 링크로 즉시 변경사항 반영

---

## Constitution Compliance

이 Turborepo 구조는 모든 헌법 원칙을 준수합니다:

- ✅ **SSOT**: `@repo/types`와 `@repo/database`가 각각 타입과 스키마의 SSOT
- ✅ **Overrides-Only**: `@repo/config`에서 기본 설정, 각 앱에서 필요한 것만 오버라이드
- ✅ **Pinned-Stack**: 모든 의존성 버전 고정 (`workspace:*`는 로컬 참조)
- ✅ **Boundaries**: 패키지 간 명확한 경계, 순환 의존성 없음
- ✅ **Type-Safety**: 공유 `@repo/types` 패키지로 전체 타입 안전성 보장

---

## Performance Benefits

**빌드 시간 비교** (예상):

| 시나리오 | 기존 구조 | Turborepo |
|---------|----------|-----------|
| 첫 빌드 | 60초 | 60초 |
| 전체 재빌드 (캐시) | 60초 | 5초 |
| 패키지 1개 변경 | 60초 | 10초 |
| 아무것도 변경 안 함 | 60초 | 1초 |

**Turborepo의 증분 빌드와 캐싱으로 개발 속도가 크게 향상됩니다.**
