"""Deterministic schema validation for phase artifacts.

Usage: python scripts/validator.py <spec|design|coverage|pr_meta> <path>
Exit code: 0 = valid, 1 = invalid.
"""
import json
import sys

SCHEMAS = {
    "spec": {
        "story_id": str,
        "title": str,
        "acceptance_criteria": list,
    },
    "design": {
        "components": list,
        "endpoints": list,
        "security_controls": list,
    },
    "coverage": {
        "status": str,
        "attempts": int,
        "max_retries": int,
        "line_coverage_pct": (int, float),
    },
    "pr_meta": {
        "title": str,
        "branch": str,
        "status": str,
        "review_summary": list,
    },
}

# Fields that must be present and non-empty for "grounding" (source traceability).
# Every finding/claim must point back to a requirement ID, file+line, or log line.
GROUNDING_FIELDS = {
    "spec": ["story_id"],
    "design": ["story_id"],
}


def validate(kind: str, data: dict) -> list:
    errors = []
    for key, expected in SCHEMAS[kind].items():
        if key not in data:
            errors.append(f"missing '{key}'")
        elif not isinstance(data[key], expected):
            expected_name = expected.__name__ if hasattr(expected, "__name__") else str(expected)
            errors.append(f"'{key}' must be {expected_name}")

    for field in GROUNDING_FIELDS.get(kind, []):
        if not data.get(field):
            errors.append(f"ungrounded: missing or empty source reference '{field}'")
    return errors


if __name__ == "__main__":
    kind, path = sys.argv[1], sys.argv[2]
    if kind not in SCHEMAS:
        print(f"Unknown schema '{kind}'")
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    errors = validate(kind, data)
    if errors:
        print("INVALID: " + "; ".join(errors))
        sys.exit(1)
    print("VALID")



