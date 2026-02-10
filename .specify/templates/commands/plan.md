# /speckit.plan 명령 템플릿

**필수**: 이 명령은 실행 시 반드시 `specs/00-tech-stack.md`를 참조해야 합니다.

예시 사용법(문서 참조 포함):

```
# 명시적 참조 포함 예시 (plan.md 상단에 표시)
Tech-Stack: specs/00-tech-stack.md

# /speckit.plan 실행 예시
/speckit.plan --spec specs/[###-feature]/spec.md --tech-stack specs/00-tech-stack.md
```

설명:
- 생성되는 `plan.md`에는 상단에 `Tech-Stack: specs/00-tech-stack.md` 라인을 포함해야 합니다.
- 새로운 의존성이나 환경 요구가 있을 경우 `specs/00-tech-stack.md`를 먼저 업데이트하고 커밋하세요.

