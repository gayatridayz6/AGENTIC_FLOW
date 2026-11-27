# Agentic AI Workflow — Spring Boot Capstone Pipeline

An orchestrator-led, hierarchical multi-agent pipeline that takes a Jira story through the full SDLC
(Requirements → Architecture → Development → Testing → Self-Healing → PR + HITL → Observability)
for a Java Spring Boot codebase, with deterministic validation, audit logging, and human approval gates.

## Pinned Versions (for reproducibility)

| Component        | Version / Model              |
|-------------------|-------------------------------|
| Java              | 17+                           |
| Spring Boot       | 3.x                            |
| Build tool        | Maven                          |
| Test framework    | JUnit 5 + Mockito              |
| Coverage tool     | JaCoCo                         |
| Orchestrator model| Claude Sonnet 4.5              |
| Dev/Arch/Heal model| Claude Sonnet 4.5             |
| Req/Test/PR/Dashboard model | GPT-4.1               |
| Python (scripts)  | 3.11+                          |

> Update this table whenever a model or tool version changes. Every run should be reproducible against
> the versions pinned here — do not silently upgrade a model mid-project without updating this file.

## Repository Layout

```
.github/
  copilot-instructions.md   # global governance, security, determinism rules
  agents/                   # orchestrator_agent.md + 1.req_agent ... 7.dashboard_agent
  instructions/                  # *_instructions.md per phase
  skills/                   # modular capability packages (SKILL.md each)
  hooks/                    # pre_write_isolation.py, pre_tool_use_hitl.py, post_tool_use_audit.py
  (see .mcp.json at repo root) # MCP endpoints, ${VAR} only
  settings.json             # deny-all-then-allow least-privilege policy
scripts/                    # validator.py, self_heal.py, cost_monitor.py
state/                      # run.json, summary.md, memory.json, .approval (human-created)
workspace/artifacts/<agent>/ # isolated per-agent outputs
logs/                       # audit.jsonl, cost.json
eval/                       # golden_set.json, score.py (agent evaluation)
```

## How to Run

1. Copy `.env.example` → `.env` and fill in `GITHUB_PAT`, `ATLASSIAN_BASIC_AUTH`. **Never commit `.env`.**
2. Open `orchestrator_agent` as a custom agent and give it a Jira story ID or raw requirement text.
3. It runs Phases 0–7 end-to-end in one session, pausing only at the Phase 6 HITL gate.
4. To approve the PR gate: run `python .github/hooks/pre_tool_use_hitl.py --approve` in your own terminal, review the PR details, and type `yes`. It writes `state/.approval` for you; then resume the orchestrator.

## Replaying a Run

Every run's inputs and decisions are captured in `state/run.json` (phase statuses, artifacts, retries,
HITL decisions) and `state/summary.md` (human-readable log). To replay or audit a past run:

1. Keep the `story_id` and the original Jira ticket content (or raw requirement text) — this is the only
   external input the pipeline consumes.
2. Re-run `orchestrator_agent` with the same `story_id`; the **incremental check** (Section in
   `orchestrator_agent.md`) will detect existing artifacts and skip already-completed phases.
3. `logs/audit.jsonl` provides a full tool-call trace for the original run, for side-by-side comparison.

## Evaluating the Agent

See `eval/golden_set.json` for 5 representative requirement scenarios and `eval/score.py` to run them
against the pipeline and score artifact correctness (schema validity + grounding) deterministically.
Run after any prompt or model change to catch regressions:

```
python eval/score.py
```

## Data Policy

Use synthetic or masked data only. No real customer data, production credentials, or personal data may
appear anywhere in this repository, in prompts, in `workspace/artifacts/`, or in `logs/`.

## Security

- Secrets live only in `.env` (gitignored) and are referenced as `${VAR}` in `.mcp.json`.
- `.github/settings.json` denies agent reads of `.env` and writes outside each agent's artifact folder.
- See `.github/copilot-instructions.md` for the full governance model.
