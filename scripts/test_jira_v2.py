#!/usr/bin/env python3
"""Test Jira connection and pull user story details - Version 2."""
import os
import sys
import json
from pathlib import Path

def load_env_file(env_path=None):
    """Load environment variables from .env file."""
    if env_path is None:
        env_path = Path(__file__).parent.parent / ".env"

    if not Path(env_path).exists():
        print(f"Warning: .env file not found at {env_path}")
        return

    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip()
                        print(f"✓ Loaded: {key.strip()}")
    except Exception as e:
        print(f"Error loading .env file: {e}")

def test_jira_connection(story_id):
    """Test Jira connection."""
    try:
        import requests
    except ImportError:
        print("Error: 'requests' library not installed. Installing...")
        os.system("pip install requests")
        import requests

    # Load environment
    load_env_file()

    auth_token = os.getenv("ATLASSIAN_BASIC_AUTH")
    if not auth_token:
        print("✗ Error: ATLASSIAN_BASIC_AUTH environment variable not set")
        return False

    print(f"\n✓ Auth token loaded: {auth_token[:20]}...")

    # Jira API endpoint
    jira_url = "https://jiraeu.epam.com"
    api_endpoint = f"{jira_url}/rest/api/3/issues/{story_id}"

    print(f"\nTesting Jira connection...")
    print(f"URL: {api_endpoint}")
    print(f"Story ID: {story_id}")
    print("-" * 80)

    try:
        # Make request with proper headers
        headers = {
            "Authorization": f"Basic {auth_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        print(f"Headers: {headers}")
        print("Making request...")

        response = requests.get(api_endpoint, headers=headers, timeout=10)

        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            data = response.json()
            print(f"✓ Connection successful (HTTP {response.status_code})")
            print("\n📋 User Story Details:")
            print("-" * 80)

            # Extract and display key information
            fields = data.get("fields", {})
            story_details = {
                "key": data.get("key"),
                "type": fields.get("issuetype", {}).get("name"),
                "summary": fields.get("summary"),
                "description": fields.get("description"),
                "status": fields.get("status", {}).get("name"),
                "assignee": fields.get("assignee", {}).get("displayName") if fields.get("assignee") else "Unassigned",
                "reporter": fields.get("reporter", {}).get("displayName") if fields.get("reporter") else "Unknown",
                "priority": fields.get("priority", {}).get("name"),
                "created": fields.get("created"),
                "updated": fields.get("updated"),
                "project": fields.get("project", {}).get("key"),
            }

            # Print formatted output
            print(f"Key:         {story_details['key']}")
            print(f"Type:        {story_details['type']}")
            print(f"Summary:     {story_details['summary']}")
            print(f"Status:      {story_details['status']}")
            print(f"Priority:    {story_details['priority']}")
            print(f"Assignee:    {story_details['assignee']}")
            print(f"Reporter:    {story_details['reporter']}")
            print(f"Project:     {story_details['project']}")
            print(f"Created:     {story_details['created']}")
            print(f"Updated:     {story_details['updated']}")

            if story_details['description']:
                print(f"\nDescription:")
                print("-" * 80)
                if isinstance(story_details['description'], dict):
                    if 'content' in story_details['description']:
                        for item in story_details['description'].get('content', []):
                            if item.get('type') == 'paragraph':
                                for content in item.get('content', []):
                                    if content.get('type') == 'text':
                                        print(content.get('text', ''))
                else:
                    print(story_details['description'])

            print("\n✓ Full JSON response:")
            print("-" * 80)
            print(json.dumps(data, indent=2))

            return True
        else:
            print(f"✗ HTTP Error {response.status_code}: {response.reason}")
            print(f"Response: {response.text[:500]}")
            return False

    except Exception as e:
        print(f"✗ Error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    story_id = sys.argv[1] if len(sys.argv) > 1 else "EPMCDMETST-70442"
    success = test_jira_connection(story_id)
    sys.exit(0 if success else 1)
