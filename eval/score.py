"""Deterministic agent evaluation scorer.

Usage: python eval/score.py [path/to/spec.json ...]
If no paths given, scores existing workspace/artifacts/requirement/spec.json
against eval/golden_set.json heuristics (title keyword + min AC count + required fields).

This does NOT call any LLM. It is a pure, repeatable scoring script so that a
prompt or model change can be compared against the same golden set every time.
"""
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GOLDEN_SET = os.path.join(os.path.dirname(__file__), "golden_set.json")


def load_golden_set() -> dict:
    with open(GOLDEN_SET, encoding="utf-8") as f:
        return json.load(f)


def score_case(case: dict, spec: dict) -> dict:
    expected = case["expected_spec"]
    errors = []

    for field in expected.get("required_fields", []):
        if not spec.get(field):
            errors.append(f"missing/empty required field '{field}'")

    title = (spec.get("title") or "").lower()
    keyword = expected.get("title_contains", "").lower()
    if keyword and keyword not in title:
        errors.append(f"title does not mention '{keyword}' (grounding check failed)")

    ac = spec.get("acceptance_criteria") or []
    min_ac = expected.get("min_acceptance_criteria", 1)
    if len(ac) < min_ac:
        errors.append(f"only {len(ac)} acceptance_criteria, expected >= {min_ac}")

    return {
        "case_id": case["id"],
        "pass": len(errors) == 0,
        "errors": errors,
    }


def main() -> int:
    golden = load_golden_set()
    spec_paths = sys.argv[1:]

    if not spec_paths:
        default_spec = os.path.join(ROOT, "workspace", "artifacts", "requirement", "spec.json")
        spec_paths = [default_spec] if os.path.exists(default_spec) else []

    if not spec_paths:
        print("No spec.json found. Run the pipeline first, or pass paths explicitly:")
        print("  python eval/score.py path/to/spec1.json path/to/spec2.json ...")
        return 1

    results = []
    # Simple pairing: score the first available spec against every golden case
    # (use this to spot-check one run; for full regression testing, generate
    # one spec.json per golden case and pass all paths in order).
    for i, path in enumerate(spec_paths):
        with open(path, encoding="utf-8") as f:
            spec = json.load(f)
        case = golden["cases"][i % len(golden["cases"])]
        results.append(score_case(case, spec))

    passed = sum(1 for r in results if r["pass"])
    total = len(results)

    print(f"\n=== Golden Set Evaluation: {passed}/{total} passed ===\n")
    for r in results:
        status = "PASS" if r["pass"] else "FAIL"
        print(f"[{status}] {r['case_id']}")
        for e in r["errors"]:
            print(f"    - {e}")

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
