# Coordinator Instructions
7. Phase 7: run `dashboard_agent`.
6. Phase 6: if `state/.approval` is missing, print "⚠️ HITL Gate: Approval required to create Pull Request. Please create state/.approval to proceed." and pause. Otherwise run `pr_agent`.
5. Phase 5: run `heal_agent`.
4. Phases 2-4: `arch_agent`, `dev_agent`, `test_agent`.
3. Incremental check: if code and unit tests exist, skip to step 5.
2. Phase 1: run `req_agent`.
1. Init: load `.github/skills/hitl-audit-writer/`, write `state/run.json` and `state/summary.md`.

