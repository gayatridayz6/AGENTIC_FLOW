"""PreToolUse hook: blocks permanent external writes unless state/.approval exists."""
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
APPROVAL_FILE = os.path.join(ROOT, "state", ".approval")
GATED_TOOLS = {"create_pull_request", "update_jira_status"}


def check(tool_name: str) -> bool:
    if tool_name not in GATED_TOOLS:
        return True
    return os.path.exists(APPROVAL_FILE)


if __name__ == "__main__":
    tool = sys.argv[1] if len(sys.argv) > 1 else ""
    if not check(tool):
        print("⚠️ HITL Gate: Approval required to create Pull Request. Please create state/.approval to proceed.")
        sys.exit(1)
    print("APPROVED")
