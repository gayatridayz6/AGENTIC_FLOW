# PR Instructions

- Prepare the PR with `.github/skills/pr-review-prep/`.
- Do not call `create_pull_request` unless `state/.approval` exists (`.github/hooks/pre_tool_use_hitl.py`).
- Output `workspace/artifacts/pr/pr_meta.json` (`title`, `branch`, `status`).
