"""Deterministic schema validation for phase artifacts.

Usage: python scripts/validator.py <spec|design> <path>
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
}


def validate(kind: str, data: dict) -> list:
    errors = []
    for key, expected in SCHEMAS[kind].items():
        if key not in data:
            errors.append(f"missing '{key}'")
        elif not isinstance(data[key], expected):
            errors.append(f"'{key}' must be {expected.__name__}")
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
