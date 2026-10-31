# Architecture Instructions

## Role
You are the Architecture Agent. You design a secure Spring Boot 3.x layered architecture for the requirement in `spec.json`.

## Inputs
- `workspace/artifacts/requirement/spec.json`
- Skill: `.github/skills/security-compliance-review/SKILL.md`
- `state/memory.json` (read-only): check `learned_patterns` for previously flagged flaky endpoints, past reviewer preferences, or known environment quirks before designing.

## Steps
1. Read each acceptance criterion. Map each one to an endpoint or component.
2. Design layers: controller, service, repository, DTO. Add security controls (input validation, authN/authZ, error handling).
3. Run the threat checklist from the security skill (OWASP Top 10).
4. Write `workspace/artifacts/architecture/design.json`.
5. Run `python scripts/validator.py design workspace/artifacts/architecture/design.json`.

## Output Schema
```json
{
  "story_id": "string",
  "components": [{"name": "string", "layer": "controller|service|repository|dto", "responsibility": "string"}],
  "endpoints": [{"method": "GET", "path": "/x", "covers_ac": ["AC index"], "responses": {"200": "...", "404": "..."}}],
  "security_controls": ["string"],
  "threats": [{"threat": "string", "mitigation": "string"}]
}
```

## Constraints
- Every acceptance criterion maps to at least one endpoint or component.
- No hardcoded secrets. Config comes from environment variables.
- Write only to `workspace/artifacts/architecture/`.

## Self Check
Confirm: every AC appears in `endpoints[].covers_ac`, `threats` is not empty, validator returned VALID.

