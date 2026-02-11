# 기능 명세: Storybook — shadcn/ui 컴포넌트 + react-hook-form + 레이아웃 스토리

**브랜치**: `01-storybook-shadcn-forms`  
**작성일**: 2026-02-10  
**상태**: 드래프트  
**입력**: 사용자 설명: "Storybook: shadcn/ui components + react-hook-form + layout stories"

## 요약 (한 줄)
UI 구현은 shadcn/ui 사용을 기본 규칙으로 강제하고, 신규 UI 컴포넌트가 필요할 경우 Tailwind CSS로 작성하며, react-hook-form(RHF) 연동 예시와 반응형 레이아웃 패턴을 Storybook으로 문서화합니다.

## 사용자 시나리오 및 테스트

### US1 - 개발자: 컴포넌트 탐색 및 학습 (우선순위: P1)
개발자는 컴포넌트의 변형, 크기, 상태 및 사용 예시(코드 포함)를 Storybook에서 보고 바로 활용할 수 있어야 합니다.

테스트: Storybook에서 Button 스토리 열기 → 변형/크기/아이콘/disabled 상태가 보이고 코드 패널에 예시가 있는지 확인.

수용 조건:
- Button 스토리에서 변형, 크기, 아이콘 예시, disabled 상태, 코드 패널이 표시되어야 합니다.
- Input/TextField 스토리에서는 Controller와 register 예시가 모두 있고, 유효성 메시지가 동작해야 합니다.

### US2 - 개발자: react-hook-form 사용 폼 (우선순위: P1)
개발자는 RHF를 사용하는 폼 스토리를 통해 유효성 검사, 제출, 리셋, 비동기 검증, 모달 내부 폼 사용법을 확인할 수 있어야 합니다.

테스트: 스토리에서 폼을 채우고 제출/유효성 시나리오를 실행하여 동작을 검증.

수용 조건:
- 필수 필드가 비어있는 상태에서 제출 시 유효성 메시지가 표시되고 제출이 차단됩니다.
- 비동기 검증(예: 사용자명 중복) 시 실패하면 오류 메시지가 표시되고 제출이 차단됩니다.

### US3 - 디자이너/리뷰어: 반응형 패턴 검증 (우선순위: P2)
디자이너는 Container, Grid, Stack 등의 레이아웃 스토리를 통해 화면 크기별 동작을 검증할 수 있어야 합니다.

테스트: Storybook 뷰포트(모바일/태블릿/데스크탑)를 변경하여 레이아웃 변경을 확인.

수용 조건:
- 반응형 Grid 스토리에서 뷰포트 변경 시 컬럼 수가 문서대로 변해야 합니다.

### US4 - QA: 접근성 및 테스트 검증 (우선순위: P1)
QA는 스토리에 접근성 주석과 a11y 검사를 통합하여 자동화된 접근성 검사를 실행할 수 있어야 합니다.

테스트: Storybook a11y 애드온을 사용해 주요 스토리의 치명적(a11y critical) 위반사항이 없는지 확인.

수용 조건:
- 주요 스토리(Button, Input, Form, Modal)에서 a11y 애드온의 치명적 위반이 없어야 합니다.

### 엣지 케이스
- 스토리 props가 null/undefined일 때 안전하게 동작해야 합니다.
- 비동기 검증이 매우 느린 경우 로딩 상태를 시뮬레이션해야 합니다.
- 옵션이 많은 Select(>1000)에서는 가상화나 스크롤 권장 사항을 문서화해야 합니다.

## 요구사항

### 기능 요구사항 (테스트 가능)
FR-001: Button, Input/TextField, Select/Dropdown, Checkbox/Radio, Modal/Dialog, Layouts, Composed Form 등 각 컴포넌트에 대한 스토리를 제공해야 합니다.

FR-001a: 본 기능 범위의 UI는 shadcn/ui 컴포넌트를 강제 사용해야 하며, 동일 목적의 임의 커스텀 UI 라이브러리 도입은 허용하지 않아야 합니다.

FR-002: 최소 하나의 RHF 기반 폼 스토리를 제공해야 하며, Controller와 register 사용 예시, 동기/비동기 유효성, 제출/리셋 흐름을 포함해야 합니다.

FR-003: Modal 내 폼 스토리를 제공하여 모달의 focus-trap 및 접근성 동작을 검증할 수 있어야 합니다.

FR-004: 레이아웃 스토리는 Container, Grid, Stack을 포함하고 모바일/태블릿/데스크탑의 반응형 스토리를 포함해야 합니다.

FR-005: 모든 스토리는 접근성 주석을 포함하고 a11y 검사 권장을 제공해야 합니다.

FR-006: 스토리는 MDX 또는 Controls 코드 패널에 TypeScript용 복사-붙여넣기 가능한 코드 예시를 포함해야 합니다.

FR-007: Storybook 빌드 시 TypeScript 오류가 없어야 합니다.

FR-008: 시각 회귀 및 단위 테스트(예시)를 위한 테스트 가이드를 제공해야 합니다.

FR-009: 신규 UI 컴포넌트를 추가해야 하는 경우 Tailwind CSS 유틸리티 클래스로 작성해야 하며, shadcn/ui의 토큰/스타일 체계와 일관성을 유지해야 합니다.

### 비기능 요구사항
NFR-001: 로컬에서 스토리 로드 시간이 합리적이어야 합니다(대략 페이지 열림 <3초 기대).
NFR-002: 문서는 중급 React+TypeScript 개발자가 이해할 수 있어야 합니다.

## 성공 기준
- Storybook 빌드 및 실행 시 TypeScript 에러 없음.
- 필수 스토리가 모두 존재하고 코드 예시를 포함함.
- 폼 스토리는 최소 3가지 유효성 시나리오(필수, 패턴, 비동기)를 포함.
- 레이아웃 스토리는 세 가지 뷰포트에서 문서화된 동작을 보여줌.
- 주요 스토리에 치명적 a11y 위반 없음.
- 최소 하나의 시각 회귀/단위 테스트 예시 포함 및 실행 가능.
- 스토리/예시 코드에서 UI 계층은 shadcn/ui 우선 원칙을 따르고, 신규 UI는 Tailwind 기반으로 작성됨.

## 핵심 개념
- Component Story: 컴포넌트 변형을 보여주는 Storybook 인스턴스
- Composed Form: 여러 컴포넌트를 조합하고 RHF와 연결한 스토리
- Layout Story: Container/Grid/Stack 및 반응형 동작 예시
- Breakpoints: mobile/tablet/desktop 네이밍된 브레이크포인트

## 코드 예시 (TypeScript + JSX)
- 코드 예시는 shadcn/ui의 일반적인 컴포넌트 이름(Input, Button 등)을 사용합니다. 프로젝트에서 실제 이름이 다르면 import를 조정하세요.

(아래 예시들은 코드 블록으로 그대로 사용 가능합니다)

1) Controller 기반 제어형 Input 예시

```tsx
// Example: FormControlWithController.tsx
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "ui"; // replace with actual shadcn/ui import
import { Button } from "ui";

type FormValues = {
  firstName: string;
  email: string;
};

export function FormWithController() {
  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { firstName: "", email: "" },
  });

  const onSubmit = (data: FormValues) => {
    console.log("submitted", data);
    return Promise.resolve();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        name="firstName"
        control={control}
        rules={{ required: "First name is required" }}
        render={({ field, fieldState }) => (
          <div>
            <Input {...field} placeholder="First name" aria-invalid={!!fieldState.error} />
            {fieldState.error && <span role="alert">{fieldState.error.message}</span>}
          </div>
        )}
      />

      <Controller
        name="email"
        control={control}
        rules={{
          required: "Email is required",
          pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
        }}
        render={({ field, fieldState }) => (
          <div>
            <Input {...field} type="email" placeholder="Email" aria-invalid={!!fieldState.error} />
            {fieldState.error && <span role="alert">{fieldState.error.message}</span>}
          </div>
        )}
      />

      <div style={{ marginTop: 12 }}>
        <Button type="submit" disabled={formState.isSubmitting}>
          Submit
        </Button>
        <Button type="button" onClick={() => reset()}>
          Reset
        </Button>
      </div>
    </form>
  );
}
```

2) register 기반 간단한 Input 예시

```tsx
import React from "react";
import { useForm } from "react-hook-form";
import { Input, Button } from "ui";

type Values = { name: string };

export function RegisterForm() {
  const { register, handleSubmit, formState } = useForm<Values>();
  const onSubmit = (data: Values) => console.log("register submit", data);
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register("name", { required: "Name required" })} placeholder="Name" />
      {formState.errors.name && <span>{formState.errors.name.message}</span>}
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

3) Select(단일/다중) Controller 예시

```tsx
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Select } from "ui";

type Data = { tags: string[]; country: string };

export function SelectForm() {
  const { control, handleSubmit } = useForm<Data>({ defaultValues: { tags: [], country: "" }});
  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      <Controller
        name="country"
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <Select.Trigger>Country</Select.Trigger>
            <Select.Content>
              <Select.Item value="us">United States</Select.Item>
              <Select.Item value="ca">Canada</Select.Item>
            </Select.Content>
          </Select>
        )}
      />
      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <Select multiple value={field.value} onValueChange={field.onChange}>
            <Select.Trigger>Tags</Select.Trigger>
            <Select.Content>
              <Select.Item value="design">Design</Select.Item>
              <Select.Item value="engineering">Engineering</Select.Item>
            </Select.Content>
          </Select>
        )}
      />
    </form>
  );
}
```

4) Modal/Dialog 내 폼 예시 (포커스 트랩 및 접근성 노트)

```tsx
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogTrigger, DialogContent } from "ui";
import { Button, Input } from "ui";

export function FormInDialog() {
  const { control, handleSubmit } = useForm<{ email: string }>();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open form modal</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(data => console.log("submit", data))}>
          <Controller
            name="email"
            control={control}
            rules={{ required: "Email required" }}
            render={({ field }) => <Input {...field} placeholder="Email" />}
          />
          <Button type="submit">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## 문서(Documentation) 스토리
- "How to use with react-hook-form" MDX 문서를 추가하여 Controller 예시와 Controller vs register 사용 가이드를 포함하세요.
- 복사-붙여넣기 가능한 코드 블록과 Play 상호작용 예시를 포함하세요.

## 접근성 노트
- Storybook a11y addon 통합을 권장합니다.
- 각 스토리는 키보드 동작(버튼 포커스, 모달 포커스 트랩, 셀렉트 키보드 네비게이션)을 명시해야 합니다.
- 유효성 메시지는 role="alert" 및 aria-invalid 속성 사용을 권장합니다.

## 테스트 노트
- 시각 회귀: 주요 스토리에 대해 Chromatic 또는 Storybook 스냅샷 테스트 권장.
- 단위 테스트: React Testing Library 예시로 폼 검증 및 제출 동작 테스트 제공.
- 접근성 테스트: jest-axe 또는 axe-playwright 사용 권장.
- CI: Storybook 빌드 + ts-check + 테스트를 PR 파이프라인에 포함하세요.

## 수용 기준 요약
- 모든 스토리가 Storybook에서 TypeScript 오류 없이 실행되어야 합니다.
- 폼 스토리는 RHF 사용법(예: Controller)과 코드 샘플을 제공해야 합니다.
- 레이아웃 스토리는 반응형 동작과 브레이크포인트 문서를 포함해야 합니다.
- a11y 노트와 기본 a11y 검사 권장을 포함해야 합니다.
- 시각 회귀/단위 테스트 예시를 포함해야 합니다.

## 가정
- 프로젝트는 React + TypeScript, pnpm 사용.
- Storybook이 이미 구성되어 있다고 가정(없으면 plan.md의 설치/설정 절차 따름).
- shadcn/ui 컴포넌트는 로컬 `ui` 패키지이거나 npm 의존성으로 제공된다고 가정. 없다면 plan에서 설치 방법 제시.
- UI 정책은 "shadcn/ui 강제 + 신규 UI는 Tailwind 작성"을 기본으로 가정.
- Storybook은 Vite 또는 Webpack 같은 현대적 번들러를 사용한다고 가정.

## 결정 사항 (2026-02-10)
- RQ1 결정: `shadcn/ui`는 로컬 벤더링(`packages/ui`) 방식을 사용합니다.
- RQ2 결정: 시각 회귀는 오픈소스 스냅샷 방식을 기본으로 사용하며 Chromatic은 선택 옵션으로 유지합니다.

## 결정 사항 (2026-02-11)
- RQ3 결정: UI 구현은 shadcn/ui를 강제 사용하고, 신규 UI 컴포넌트는 Tailwind CSS로 작성합니다.

