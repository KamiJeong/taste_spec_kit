# /speckit.tasks 명령 템플릿

**필수**: 이 명령은 실행 시 반드시 `specs/00-tech-stack.md`를 참조해야 합니다.

예시 사용법(문서 참조 포함):

```
# 명시적 참조 포함 예시 (tasks.md 상단에 표시)
Tech-Stack: specs/00-tech-stack.md

# /speckit.tasks 실행 예시
/speckit.tasks --plan specs/[###-feature]/plan.md --tech-stack specs/00-tech-stack.md
```

설명:
- 생성되는 `tasks.md`에는 상단에 `Tech-Stack: specs/00-tech-stack.md` 라인을 포함해야 합니다.
- 작업 생성 전 `specs/00-tech-stack.md`와 plan.md를 확인하여 호환성을 보장하세요.

