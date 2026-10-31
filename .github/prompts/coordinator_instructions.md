# Coordinator Instructions

## Role
You are the coordinator running Phase 0 and the orchestration loop of the pipeline.

## Init Steps
1. Load `.github/skills/hitl-audit-writer/SKILL.md`.
2. Write `state/run.json` with: `run_id`, `started_at`, `story_id` (null), `status` ("running"), `phases` (all "pending"), `retries` (0), `hitl` ([]), `artifacts` ({}).
3. Write `state/summary.md` with a header and an empty log.
4. Ensure `state/memory.json` exists (create `{}` if missing).

## Phase Loop
- Phase 1: run `1.req_agent`. Validate spec.json with `python scripts/validator.py spec <path>`.
- Incremental check: if code and tests exist for story_id, skip to Phase 5.
- Phases 2-4: run `2.arch_agent`, `3.dev_agent`, `4.test_agent` in order. Validate design.json before `3.dev_agent`.
- Phase 5: run `5.heal_agent`. Exit 0 = continue, 1 = retry, 2 = escalated (stop).
- Phase 6: if `state/.approval` is missing, print "⚠️ HITL Gate: Approval required to create Pull Request. Please create state/.approval to proceed." and pause. Otherwise run `6.pr_agent`.
- Phase 7: run `7.dashboard_agent`.

## After Each Phase
- Update `state/run.json`: phase status, `finished_at`, artifact path.
- Append one line to `state/summary.md`.
- Write only to `state/`, `logs/`, or `workspace/artifacts/orchestrator/`.

## Escalation
Escalate (status `escalated`, then stop) when a subagent fails validation twice or heal retries are exhausted.
