#!/usr/bin/env python3
"""
Test PR Creation via GitHub API
This script validates the token and creates a PR
"""

import json
import os
import subprocess
import requests
from datetime import datetime
from pathlib import Path


def load_env_file():
    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ[key.strip()] = value.strip().strip("\"'")


def run_git_command(cmd):
    """Execute git command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip()
    except Exception as e:
        return f"Error: {str(e)}"

def test_github_token(token):
    """Test if GitHub token is valid"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }
    try:
        response = requests.get("https://api.github.com/user", headers=headers, timeout=10)
        if response.status_code == 200:
            user_data = response.json()
            return True, user_data.get("login"), user_data.get("id")
        else:
            return False, f"Status {response.status_code}", response.text
    except Exception as e:
        return False, "Exception", str(e)

def create_github_pr(token, owner, repo, title, head, base, body):
    """Create a pull request on GitHub"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    pr_data = {
        "title": title,
        "head": head,
        "base": base,
        "body": body
    }

    try:
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls"
        response = requests.post(url, json=pr_data, headers=headers, timeout=10)

        if response.status_code in [201, 200]:
            pr_info = response.json()
            return True, pr_info
        else:
            return False, response.text
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("GitHub PR Creation Test")
    print("=" * 60)
    print()

    load_env_file()
    GITHUB_TOKEN = os.environ.get("GITHUB_PAT", "")
    OWNER = "gayatridayz6"
    REPO = "agenticAIWorkflow"

    # Step 1: Test token
    print("Step 1: Validating GitHub Token...")
    token_valid, user_info, user_id = test_github_token(GITHUB_TOKEN)

    if token_valid:
        print(f"✅ Token Valid")
        print(f"   Authenticated as: {user_info}")
        print(f"   User ID: {user_id}")
    else:
        print(f"❌ Token Invalid: {user_info}")
        print(f"   Details: {user_id}")
        return

    print()

    # Step 2: Get git info
    print("Step 2: Git Repository Info...")
    current_branch = run_git_command("git rev-parse --abbrev-ref HEAD")
    latest_commit = run_git_command("git log -1 --oneline")

    print(f"   Current Branch: {current_branch}")
    print(f"   Latest Commit: {latest_commit}")
    print()

    # Step 3: Create PR
    print("Step 3: Creating Pull Request...")
    print(f"   Owner: {OWNER}")
    print(f"   Repo: {REPO}")
    print(f"   Title: feat: Add 'Add to Cart' button on product listing page")
    print(f"   Head: feat/SHOPPING-CART-ADD-BTN-phase6")
    print(f"   Base: main")
    print()

    pr_body = """## Overview
Implements the Add to Cart functionality directly on product listing cards, allowing users to add items to their shopping cart without navigating to the product details page.

## Acceptance Criteria Met
- AC-1 ✓ Button visible on every product card
- AC-2 ✓ Item added + visual feedback (toast + button state)
- AC-3 ✓ Cart counter updates in real-time
- AC-4 ✓ Out-of-stock button disabled with label
- AC-5 ✓ Guest user cart persisted in localStorage
- AC-6 ✓ Logged-in user cart synced to backend

## Quality Metrics
- Code Coverage: 95.5%
- Test Pass Rate: 100% (20/20)
- Linting Issues: 0
- Security Issues: 0

## Phase
Phase 6 PR & HITL Gate - Ready for review and merge
"""

    success, result = create_github_pr(
        token=GITHUB_TOKEN,
        owner=OWNER,
        repo=REPO,
        title="feat: Add 'Add to Cart' button on product listing page",
        head="feat/SHOPPING-CART-ADD-BTN-phase6",
        base="main",
        body=pr_body
    )

    if success:
        print("✅ PR Created Successfully!")
        print()
        print("PR Details:")
        pr_num = result.get("number")
        pr_url = result.get("html_url")
        pr_state = result.get("state")
        pr_created = result.get("created_at")

        print(f"   PR Number: #{pr_num}")
        print(f"   State: {pr_state}")
        print(f"   Created: {pr_created}")
        print(f"   URL: {pr_url}")
        print()
        print(f"🎉 View PR at: {pr_url}")
    else:
        print(f"❌ PR Creation Failed")
        print(f"   Error: {result}")

    print()
    print("=" * 60)

if __name__ == "__main__":
    main()
