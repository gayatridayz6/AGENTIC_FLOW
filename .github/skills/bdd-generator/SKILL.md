---
name: bdd-generator
description: Converts spec.json acceptance criteria into Given/When/Then scenarios that guide Spring Boot implementation. Use in Phase 3.
---

# BDD Generator

Tools: `read/readFile`, `edit/createFile`.

## Purpose
Create one BDD scenario per acceptance criterion and use it as the implementation contract.

## Format
```
Scenario: {short name tied to AC index}
Given {precondition}
When {action with HTTP method and path}
Then {expected status and body}
```

## Example
```
Scenario: AC-2 unknown order returns 404
Given no order with id 999 exists
When GET /orders/999 is called
Then the response status is 404
```

## Rules
- One scenario per AC. No scenario without an AC.
- Scenarios go to `workspace/artifacts/dev/docs/bdd.md`.

