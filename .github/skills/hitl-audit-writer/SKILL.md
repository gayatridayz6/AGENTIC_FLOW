# hitl-audit-writer

Maintain `state/run.json` and `state/summary.md`. Log each HITL gate decision.

---
name: hitl-audit-writer
description: Maintains state/run.json and state/summary.md and logs every HITL gate decision. Use in Phase 0 and after each phase.
---

<purpose>
Keep the run state accurate and auditable.
</purpose>

<procedure>
1. Phase start: set the phase status to "running" in `state/run.json`.
2. Phase end: set status to passed, failed, skipped, paused, or escalated, plus `finished_at`.
3. HITL check: record `{ "ts", "gate": "create_pull_request", "approved": true|false }` in the `hitl` array.
4. Append one line to `state/summary.md`: `- [timestamp] Phase <n> <status>: <artifact>`.
</procedure>

<rules>
- Write only to `state/`.
- Never mark a gated action as done without an approval record.
</rules>
