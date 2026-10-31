"""PreWrite hook: restricts subagent writes to workspace/artifacts/<agent>/.

Enforces the deny rules declared in .github/settings.json (no-write-outside-artifacts,
no-write-state-except-orchestrator, no-read-env) so that file is the live policy source,
not just documentation.
"""
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SETTINGS_FILE = os.path.join(ROOT, ".github", "settings.json")
ALLOWED_AGENTS = {"requirement", "architecture", "dev", "test", "self-healing", "pr", "dashboard"}


def load_settings() -> dict:
    if not os.path.exists(SETTINGS_FILE):
        return {"deny": []}
    with open(SETTINGS_FILE, encoding="utf-8") as f:
        return json.load(f)


def is_denied_env_read(target_path: str, settings: dict) -> bool:
    for rule in settings.get("deny", []):
        if rule.get("rule") == "no-read-env" and os.path.basename(target_path) == rule.get("pattern"):
            return True
    return False


def is_denied_approval_write(target_path: str, settings: dict) -> bool:
    for rule in settings.get("deny", []):
        if rule.get("rule") == "no-read-approval-bypass" and rule.get("write_denied"):
            resolved = os.path.abspath(os.path.join(ROOT, target_path))
            if resolved == os.path.join(ROOT, "state", ".approval"):
                return True
    return False


def check(agent: str, target_path: str) -> tuple[bool, str]:
    settings = load_settings()

    if is_denied_env_read(target_path, settings):
        return False, "settings.json rule 'no-read-env': agents may not read .env"

    if is_denied_approval_write(target_path, settings):
        return False, "settings.json rule 'no-read-approval-bypass': only a human may write state/.approval"

    if agent == "orchestrator":
        # Orchestrator may write to state/, logs/, and workspace/artifacts/orchestrator/.
        allowed_roots = [
            os.path.join(ROOT, "state"),
            os.path.join(ROOT, "logs"),
            os.path.join(ROOT, "workspace", "artifacts", "orchestrator"),
        ]
        resolved = os.path.abspath(os.path.join(ROOT, target_path))
        if any(os.path.commonpath([root, resolved]) == root for root in allowed_roots):
            return True, "ALLOWED"
        return False, "settings.json rule 'no-write-state-except-orchestrator' scope exceeded"

    if agent not in ALLOWED_AGENTS:
        return False, f"unknown agent '{agent}' not in ALLOWED_AGENTS"

    allowed_root = os.path.join(ROOT, "workspace", "artifacts", agent)
    resolved = os.path.abspath(os.path.join(ROOT, target_path))
    if os.path.commonpath([allowed_root, resolved]) == allowed_root:
        return True, "ALLOWED"
    return False, "settings.json rule 'no-write-outside-artifacts': write outside own agent folder"


if __name__ == "__main__":
    agent, path = sys.argv[1], sys.argv[2]
    ok, message = check(agent, path)
    if not ok:
        print(f"BLOCKED: agent '{agent}' may not write to '{path}' — {message}")
        sys.exit(1)
    print("ALLOWED")


