# test-planning-strategist

Maps each acceptance criterion to positive, edge, and failure JUnit 5 + Mockito tests. Use in Phase 4.

<purpose>
Make sure every acceptance criterion has at least one test of each type where relevant.
</purpose>

<matrix>
| AC | Positive | Edge | Failure |
|---|---|---|---|
| AC-1 | shouldReturn200WhenOrderExists | shouldHandleMinimumId | shouldReturn500WhenDbDown |
</matrix>

<rules>
- Name tests `should<Expected>When<Condition>`.
- Mock external dependencies. Do not call real services.
- Output `workspace/artifacts/test/test_plan.md` with the matrix.
</rules>
