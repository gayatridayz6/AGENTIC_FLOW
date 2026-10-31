# Orchestrator Agent

- **Phase:** 0 (Init), coordinates 1-7
- **Global rules:** `copilot-instructions.md`
- **Instructions:** `.github/prompts/coordinator_instructions.md`
- **Skill:** `.github/skills/hitl-audit-writer/`
- **Hooks:** `.github/hooks/post_tool_use_audit.py` (audit), `.github/hooks/pre_tool_use_hitl.py` (HITL gate)
- **State:** `state/run.json`, `state/summary.md`, `state/memory.json`, `state/.approval`
- **Delegates to:** `req_agent`, `arch_agent`, `dev_agent`, `test_agent`, `heal_agent`, `pr_agent`, `dashboard_agent`
