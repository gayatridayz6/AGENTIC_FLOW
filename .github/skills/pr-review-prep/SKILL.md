---
name: pr-review-prep
description: Prepares PR title, branch, and review summary in pr_meta.json. Creates the PR only after state/.approval exists. Use in Phase 6.
---

# PR Review Prep

## Purpose
Prepare a reviewer-ready PR without creating it until approved.

## Procedure
1. Title: `feat({story_id}): {spec title}`.
2. Branch: `feature/{story_id}-{kebab-title}`.
3. Review summary: changed components, endpoints covered, coverage_pct, retries used, open_questions.
4. Risks: any security-compliance findings still open.
5. Write `workspace/artifacts/pr/pr_meta.json`.

## Rules
- No creation without `state/.approval` (enforced by `.github/hooks/pre_tool_use_hitl.py`).
- No secrets or raw logs in the PR body.

