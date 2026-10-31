"""PostToolUse hook: appends every tool call to logs/audit.jsonl."""
import json
import os
import sys
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
AUDIT_FILE = os.path.join(ROOT, "logs", "audit.jsonl")


def record(agent: str, tool: str, status: str) -> None:
    os.makedirs(os.path.dirname(AUDIT_FILE), exist_ok=True)
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "agent": agent,
        "tool": tool,
        "status": status,
    }
    with open(AUDIT_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


if __name__ == "__main__":
    record(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "ok")
