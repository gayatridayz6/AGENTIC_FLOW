# Dashboard Instructions

- Run `scripts/cost_monitor.py <input_tokens> <output_tokens>` to write `logs/cost.json`.
- Summarize `logs/audit.jsonl` (written by `.github/hooks/post_tool_use_audit.py`).
- Build `workspace/artifacts/dashboard.html` with `.github/skills/execution-evidence-writer/`.
