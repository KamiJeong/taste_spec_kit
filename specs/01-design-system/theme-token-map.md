Tech-Stack: specs/00-tech-stack.md

# Theme Token Map: 01-design-system

**Date**: 2026-02-12  
**Source of Truth**: `packages/ui/src/styles/styles.css`

## Token Matrix

| Token | Light | Dark | Brand | Brand Dark | Usage |
|---|---|---|---|---|---|
| `--background` | `0 0% 100%` | `222.2 84% 4.9%` | `210 60% 99%` | `220 47% 8%` | page/surface background |
| `--foreground` | `222.2 84% 4.9%` | `210 40% 98%` | `222 47% 14%` | `210 40% 96%` | primary text |
| `--primary` | `222.2 47.4% 11.2%` | `210 40% 98%` | `217 91% 60%` | `217 91% 67%` | primary action |
| `--primary-foreground` | `210 40% 98%` | `222.2 47.4% 11.2%` | `210 40% 98%` | `220 47% 8%` | text on primary |
| `--accent` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | `214 95% 94%` | `217 40% 20%` | hover/highlight background |
| `--accent-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | `219 71% 24%` | `210 40% 98%` | text on accent |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | `0 72% 52%` | `0 70% 58%` | danger state |
| `--border` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | `214 46% 86%` | `217 30% 24%` | border color |
| `--input` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | `214 46% 86%` | `217 30% 24%` | input border/background |
| `--ring` | `222.2 84% 4.9%` | `212.7 26.8% 83.9%` | `217 91% 60%` | `217 91% 72%` | focus-visible ring |

## Notes

1. Token 변경은 `styles.css`를 우선 수정하고, 컴포넌트 클래스 수정은 최소화한다.
2. `input/textarea/select/calendar/sonner`는 테마 회귀 점검 우선 대상이다.
3. Tailwind v4 마이그레이션 전까지는 v3 호환 유틸리티 문법을 유지한다.
