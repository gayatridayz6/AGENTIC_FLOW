# Self-Healing Instructions

- Run `scripts/self_heal.py` (`mvn clean test`).
- Retry at most 3 times, capturing stderr each attempt.
- Record results with `.github/skills/execution-evidence-writer/`.
- If retries are exhausted, status is `escalated`; stop and report.
