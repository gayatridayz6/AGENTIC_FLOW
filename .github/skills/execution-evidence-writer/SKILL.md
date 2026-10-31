---
name: execution-evidence-writer
description: Records test results, retry attempts, coverage, and builds the observability dashboard. Use in Phases 5 and 7.
---

<purpose>
Write evidence only. Numbers come from scripts, never from model memory.
</purpose>

<evidence_files>
- `workspace/artifacts/self-healing/coverage.json` (from scripts/self_heal.py)
- `workspace/artifacts/self-healing/attempts.json` (from scripts/self_heal.py)
- `logs/cost.json` (from scripts/cost_monitor.py)
- `workspace/artifacts/dashboard.html` (generated from the files above)
</evidence_files>

<rules>
- Do not compute or edit numeric values by hand.
- HTML-escape all text taken from logs or test output.
- Never include secrets or tokens.
</rules>
