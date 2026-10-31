"""PreWrite hook: restricts subagent writes to workspace/artifacts/<agent>/."""
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ALLOWED_AGENTS = {"requirement", "architecture", "dev", "test", "self-healing", "pr", "dashboard"}


def check(agent: str, target_path: str) -> bool:
    if agent not in ALLOWED_AGENTS:
        return False
    allowed_root = os.path.join(ROOT, "workspace", "artifacts", agent)
    resolved = os.path.abspath(os.path.join(ROOT, target_path))
    return os.path.commonpath([allowed_root, resolved]) == allowed_root


if __name__ == "__main__":
    agent, path = sys.argv[1], sys.argv[2]
    if not check(agent, path):
        print(f"BLOCKED: agent '{agent}' may not write to '{path}'")
        sys.exit(1)
    print("ALLOWED")
