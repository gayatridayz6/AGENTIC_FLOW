---
name: security-compliance-review
description: Reviews design and code for OWASP Top 10 risks, hardcoded secrets, and missing input validation. Use in Phase 2 and before PR.
---

# Security Compliance Review

Tools: `read/readFile`, `edit/createFile`.

## Purpose
Find security gaps in `design.json` and in `workspace/artifacts/dev/` before they reach a PR.

## Checklist
1. Injection: parameterized queries only (JPA or prepared statements).
2. Input validation: every request DTO uses Bean Validation annotations.
3. AuthN/AuthZ: each endpoint states its access rule.
4. Secrets: no literal passwords, keys, or tokens. Config from environment variables.
5. Error handling: no stack traces or internal details in responses.
6. Logging: no PII or secrets in logs.

## Output Format
Findings table: `| Check | Status (pass/fail) | Location | Fix |`
A single fail on check 4 blocks the phase.

