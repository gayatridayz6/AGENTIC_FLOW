BEST PRACTICES COVERAGE — SPRING BOOT CAPSTONE PIPELINE
=========================================================
Generated: October 31, 2026


LEGEND
------
[DONE]    = Fully Covered
[PARTIAL] = Partially Covered
[MISSING] = Not Covered


1. SECURITY
-----------

1.4 No hardcoded secrets                                   [DONE]
    - Tokens stored only in .env; .env listed in .gitignore
    - .github/config/mcp.json uses ${GITHUB_PAT}, ${ATLASSIAN_BASIC_AUTH}
    - copilot-instructions.md Section 2: "MCP endpoints/tokens come from
      ${VAR} environment variables only"
    - GAP: No settings.json deny-rule blocking agents from reading .env
      (currently implicit, not hard-enforced)


2. CONTEXT & STATE MANAGEMENT
------------------------------

2.1 State offloading                                        [DONE]
    - Every subagent (1.req_agent -> 7.dashboard_agent) writes full
      output to workspace/artifacts/<agent>/
    - Orchestrator requires "Artifact: <path>" + short status per phase

    copilot-instructions.md
11. Add explicit "synthetic or masked data only" rule to
10. Create a 5-10 case golden set + scoring script for agent evaluation
   how to replay a run from stored inputs
9. Rewrite README.md: pin model versions, tool versions, document
   claims in design.json / test reports / PR findings)
8. Add source-reference enforcement in validator (reject ungrounded
7. Add explicit "do not edit static context files mid-run" caching rule
6. Add per-phase token budget caps (not just post-hoc cost tracking)
   pr_meta.json, dashboard.html metadata
5. Add JSON schemas + validator entries for coverage.json,
   req_agent/arch_agent read it back on next run
4. Wire state/memory.json: heal_agent writes flaky tests;
   copilot-instructions.md
3. Add /compact guidance + context-truncation rule to
2. Define MCP fallback/error-object behavior for Jira/GitHub outages
1. Add settings.json with explicit deny-rule blocking .env reads
===============================================
RECOMMENDED NEXT ACTIONS (to close all gaps)


                    "repeatable runs", "evaluate the agent"     = 4 items
Not Covered       : 5.2 (caching), "ground every claim",

                    "least privilege", "synthetic data only"    = 8 items
Partially Covered : 2.2, 2.3, 3.2, 4.1, 4.3, 6.2,

                    "treat fetched text as untrusted"          = 11 items
                    "deterministic work", "one agent one job",
Fully Covered     : 1.4, 2.1, 3.1, 3.3, 4.2, 5.1, 5.3, 6.1,
================
SUMMARY COUNTS


                                                               or agent files
                                                               instructions.md
                                                               in copilot-
                                                               stated anywhere
Use synthetic or masked data only                 [PARTIAL]    Not explicitly

                                                               anywhere
                                                               script exists
(golden set + scoring script)                                 or eval scoring
Evaluate the agent                                [MISSING]   No golden set

                                                               storage
                                                               run-input
                                                               versions; no
                                                               model/tool
                                                               no pinned
                                                               GitLab template;
(pin versions, store inputs)                                  still default
Make every run repeatable                         [MISSING]   README.md is

                                                               every subagent
                                                               repeated in
                                                               Section 2;
                                                               instructions.md
                                                               copilot-
Treat fetched text as untrusted                   [DONE]      Stated in

                                                               not traced
                                                               findings are
                                                               design/tests/PR
                                                               source_url but
                                                               spec.json has
                                                               requirement-ID.
                                                               source /
                                                               lacking a
                                                               rejects output
Ground every claim with a source reference        [MISSING]   No validator

                                                               file exists
                                                               default policy
                                                               deny-all-by-
                                                               explicit
                                                               narrow, but no
Least privilege                                   [PARTIAL]   Tool lists are

                                                               narrow tools
                                                               artifact,
                                                               phase, 1
                                                               subagents: 1
One agent, one job, one artifact                  [DONE]      Each of 7

                                                               cost_monitor.py
judgment in model                                             self_heal.py,
Deterministic work in scripts,                    [DONE]      validator.py,
---------------------------------------------------------------------------
Rule                                              Status      Notes

===========================
DESIGN RULES & GUIDELINES


      integration (local JSONL + HTML only)
    - GAP: No OpenTelemetry export or external observability tool
    - 7.dashboard_agent produces one HTML rollup per run
      logs/audit.jsonl
    - post_tool_use_audit.py writes JSONL of every tool call to
6.2 Observability                                             [PARTIAL]

      state/run.json.hitl, never auto-creates the approval file
    - Orchestrator Phase 6 enforces this, logs decision into
      update_jira_status unless state/.approval exists
    - pre_tool_use_hitl.py blocks create_pull_request /
6.1 HITL gates                                                [DONE]

---------------
6. GOVERNANCE


      in dashboard.html
    - Orchestrator Phase 7 invokes it; 7.dashboard_agent surfaces it
      -> writes logs/cost.json
    - scripts/cost_monitor.py totals input/output tokens x model rate
5.3 Cost monitoring                                           [DONE]

    - No cache-control directive defined anywhere
      incidentally, but no explicit "do not edit mid-run" rule exists
    - Static files (copilot-instructions.md, skills) help caching
5.2 Caching                                                   [MISSING]

      7.dashboard_agent (extraction / formatting / classification)
    - GPT-4.1 -> 1.req_agent, 4.test_agent, 6.pr_agent,
      5.heal_agent (hard reasoning / code)
    - Claude Sonnet 4.5 -> orchestrator, 2.arch_agent, 3.dev_agent,
    - Each subagent frontmatter sets model: explicitly
5.1 Tier routing                                              [DONE]

--------------------
5. MODEL ECONOMICS


      not capped proactively)
    - GAP: No token budget per phase (cost is tracked post-hoc only,
    - GAP: No --max-turns equivalent for headless runs
    - Hard cap of 3 retries (MAX_RETRIES = 3 in self_heal.py)
4.3 Circuit breakers                                          [PARTIAL]

    - Orchestrator Phase 5 branches on exit codes 0 / 1 / 2
      retry -> max 3 attempts (attempts.json tracks state)
    - scripts/self_heal.py: run mvn clean test -> capture error ->
4.2 Self-healing                                              [DONE]

    - GAP: No defined MCP failure error object format
      dashboard output (only 2 of 7 artifacts validated)
    - GAP: No schema validation for coverage.json, pr_meta.json, or
    - Validation runs after Phase 1 and Phase 2
      (scripts/validator.py SCHEMAS dict)
    - JSON schemas defined for spec.json and design.json
4.1 Structured tool execution                                [PARTIAL]

--------------------------------------
4. STRUCTURED EXECUTION & RESILIENCE


    - pre_write_isolation.py hook enforces this via path check
    - Only the orchestrator writes to state/
    - Each writes only to workspace/artifacts/<agent>/
    - Each subagent has its own narrow tools: list in frontmatter
3.3 Shared-state isolation                                  [DONE]

      (flaky tests, reviewer prefs) and no Skill loads it on next run
    - GAP: Nothing currently writes meaningful content into it
    - state/memory.json exists, initialized in Phase 0
3.2 Long-term persistence                                   [PARTIAL]

    - Re-read/updated at start and end of every phase
      artifacts
    - state/run.json tracks run_id, status, phases, retries, hitl,
3.1 Short-term continuity                                   [DONE]

----------------------
3. MEMORY & ISOLATION


    - GAP: No CLAUDE.md-equivalent /compact guidance exists anywhere
    - One-session-per-phase supported via run_subagent calls
      (hitl-audit-writer skill + orchestrator Section 6)
    - Rolling state/summary.md updated at each phase end
2.3 Truncation and summarisation                             [PARTIAL]

      (e.g., Jira unreachable)
    - GAP: No fallback/error path defined if MCP call fails
    - Requirements never pasted directly into prompts (story ID only)
      mcp:atlassian; 6.pr_agent creates PR via mcp:github
    - MCP pull-on-demand works: 1.req_agent fetches Jira via
2.2 MCP on demand with fallback mechanism                   [PARTIAL]
