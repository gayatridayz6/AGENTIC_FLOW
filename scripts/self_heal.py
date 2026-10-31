"""Self-healing test runner: one `mvn clean test` attempt per call, max 3 retries.

Exit codes: 0 = tests passed, 1 = failed (retry allowed), 2 = escalated (retries exhausted).
Writes workspace/artifacts/self-healing/coverage.json and attempts.json.
"""
import csv
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROJECT_DIR = os.path.join(ROOT, "workspace", "artifacts", "dev")
HEAL_DIR = os.path.join(ROOT, "workspace", "artifacts", "self-healing")
ATTEMPTS_FILE = os.path.join(HEAL_DIR, "attempts.json")
COVERAGE_FILE = os.path.join(HEAL_DIR, "coverage.json")
JACOCO_CSV = os.path.join(PROJECT_DIR, "target", "site", "jacoco", "jacoco.csv")
MAX_RETRIES = 3


def load_attempts() -> dict:
    if os.path.exists(ATTEMPTS_FILE):
        with open(ATTEMPTS_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"attempts": 0, "history": []}


def line_coverage() -> dict:
    if not os.path.exists(JACOCO_CSV):
        return {"line_covered": 0, "line_missed": 0, "line_coverage_pct": 0.0}
    covered = missed = 0
    with open(JACOCO_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            covered += int(row["LINE_COVERED"])
            missed += int(row["LINE_MISSED"])
    total = covered + missed
    pct = round(100.0 * covered / total, 2) if total else 0.0
    return {"line_covered": covered, "line_missed": missed, "line_coverage_pct": pct}


def main() -> int:
    os.makedirs(HEAL_DIR, exist_ok=True)
    state = load_attempts()
    if state["attempts"] >= MAX_RETRIES + 1:
        print("ESCALATED: retry budget exhausted")
        return 2

    state["attempts"] += 1
    attempt = state["attempts"]
    result = subprocess.run(
        ["mvn", "clean", "test"], cwd=PROJECT_DIR,
        capture_output=True, text=True, shell=True,
    )
    passed = result.returncode == 0
    stderr_tail = "\n".join((result.stderr or result.stdout).splitlines()[-60:])

    state["history"].append({
        "attempt": attempt,
        "ts": datetime.now(timezone.utc).isoformat(),
        "passed": passed,
        "stderr_tail": None if passed else stderr_tail,
    })
    with open(ATTEMPTS_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

    if passed:
        status = "passed"
    elif attempt > MAX_RETRIES:
        status = "escalated"
    else:
        status = "failed"
        with open(os.path.join(HEAL_DIR, f"stderr_attempt_{attempt}.log"), "w", encoding="utf-8") as f:
            f.write(stderr_tail)

    coverage = {
        "status": status,
        "attempts": attempt,
        "max_retries": MAX_RETRIES,
        **line_coverage(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(COVERAGE_FILE, "w", encoding="utf-8") as f:
        json.dump(coverage, f, indent=2)

    print(f"{status.upper()} (attempt {attempt}/{MAX_RETRIES + 1})")
    if status == "passed":
        return 0
    return 2 if status == "escalated" else 1


if __name__ == "__main__":
    sys.exit(main())
