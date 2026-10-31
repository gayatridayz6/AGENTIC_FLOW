# Dashboard Agent

- **Phase:** 7
- **Instructions:** `.github/prompts/dashboard_instructions.md`
- **Skill:** `.github/skills/execution-evidence-writer/`
- **Script:** `scripts/cost_monitor.py`
- **Hook:** `.github/hooks/post_tool_use_audit.py`
- **Inputs:** `logs/audit.jsonl`, `logs/cost.json`
- **Output:** `workspace/artifacts/dashboard.html`
