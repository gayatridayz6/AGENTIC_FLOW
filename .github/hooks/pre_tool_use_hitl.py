"""PreToolUse hook: blocks permanent external writes unless state/.approval exists.

Run with --approve in a real terminal to review the PR and grant approval; the
hook then writes state/.approval itself. It refuses without a TTY so an agent
cannot approve on a human's behalf.
"""
import getpass
import json
import os
import sys
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
APPROVAL_FILE = os.path.join(ROOT, "state", ".approval")
PR_META_FILE = os.path.join(ROOT, "workspace", "artifacts", "pr", "pr_meta.json")
GATED_TOOLS = {
    "create_pull_request", "github_create_pull_request",
    "push_files", "github_push_files",
    "update_jira_status", "jira_transition_issue", "jira_add_comment",
}
BLOCKED_MESSAGE = (
    "⚠️ HITL Gate: Approval required to create Pull Request. Please create state/.approval to proceed.\n"
    "To review and approve, run in your own terminal: python .github/hooks/pre_tool_use_hitl.py --approve"
)


def check(tool_name: str) -> bool:
    if tool_name not in GATED_TOOLS:
        return True
    return os.path.exists(APPROVAL_FILE)


def request_human_approval() -> bool:
    if not (sys.stdin.isatty() and sys.stdout.isatty()):
        print("Refusing to approve: this must be run by a human in an interactive terminal.")
        return False

    if os.path.exists(PR_META_FILE):
        with open(PR_META_FILE, encoding="utf-8") as f:
            meta = json.load(f)
        print("Pull request awaiting approval:")
        for key in ("title", "branch", "base", "summary"):
            if key in meta:
                print(f"  {key}: {meta[key]}")
    else:
        print(f"No PR metadata found at {os.path.relpath(PR_META_FILE, ROOT)}.")

    if input("Type 'yes' to approve creating this Pull Request: ").strip().lower() != "yes":
        print("Not approved. No approval file written.")
        return False

    os.makedirs(os.path.dirname(APPROVAL_FILE), exist_ok=True)
    with open(APPROVAL_FILE, "w", encoding="utf-8") as f:
        f.write(f"approved by {getpass.getuser()} at {datetime.now(timezone.utc).isoformat()}\n")
    print("Approved. state/.approval written.")
    return True


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) > 1 and sys.argv[1] == "--approve":
        sys.exit(0 if request_human_approval() else 1)
    tool = sys.argv[1] if len(sys.argv) > 1 else ""
    if not check(tool):
        print(BLOCKED_MESSAGE)
        sys.exit(1)
    print("APPROVED")
