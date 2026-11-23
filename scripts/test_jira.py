"""Test Jira connection and pull user story details."""
import os
import sys
import base64
import json
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from pathlib import Path

def load_env_file(env_path: str = None) -> None:
    """Load environment variables from .env file."""
    if env_path is None:
        env_path = Path(__file__).parent.parent / ".env"

    if not Path(env_path).exists():
        print(f"Warning: .env file not found at {env_path}")
        return

    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

def test_jira_connection(story_id: str) -> dict:
    """
    Test Jira connection and pull user story details.

    Args:
        story_id: Jira story ID (e.g., EPMCDMETST-70442)

    Returns:
        dict: Story details or error information
    """
    # Get Atlassian auth from environment
    auth_token = os.getenv("ATLASSIAN_BASIC_AUTH")
    if not auth_token:
        return {"error": "ATLASSIAN_BASIC_AUTH not set in environment"}

    # Jira API endpoint
    jira_url = "https://jiraeu.epam.com"
    api_endpoint = f"{jira_url}/rest/api/3/issues/{story_id}"

    print(f"Testing Jira connection...")
    print(f"URL: {api_endpoint}")
    print(f"Story ID: {story_id}")
    print("-" * 80)

    try:
        # Create request with authentication
        req = Request(api_endpoint)
        req.add_header("Authorization", f"Basic {auth_token}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json")

        # Make the request
        with urlopen(req, timeout=10) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                print(f"✓ Connection successful (HTTP {response.status})")
                print("\n📋 User Story Details:")
                print("-" * 80)

                # Extract and display key information
                story_details = {
                    "key": data.get("key"),
                    "type": data.get("fields", {}).get("issuetype", {}).get("name"),
                    "summary": data.get("fields", {}).get("summary"),
                    "description": data.get("fields", {}).get("description"),
                    "status": data.get("fields", {}).get("status", {}).get("name"),
                    "assignee": data.get("fields", {}).get("assignee", {}).get("displayName"),
                    "reporter": data.get("fields", {}).get("reporter", {}).get("displayName"),
                    "priority": data.get("fields", {}).get("priority", {}).get("name"),
                    "created": data.get("fields", {}).get("created"),
                    "updated": data.get("fields", {}).get("updated"),
                    "project": data.get("fields", {}).get("project", {}).get("key"),
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
                    # Handle description as dict or string
                    if isinstance(story_details['description'], dict):
                        if 'content' in story_details['description']:
                            # ADF format
                            for item in story_details['description'].get('content', []):
                                if item.get('type') == 'paragraph':
                                    for content in item.get('content', []):
                                        if content.get('type') == 'text':
                                            print(content.get('text', ''))
                    else:
                        print(story_details['description'])

                print("\n✓ Full JSON response saved below:")
                print("-" * 80)
                print(json.dumps(data, indent=2))

                return {"success": True, "story": story_details, "raw_data": data}
            else:
                return {"error": f"Unexpected status code: {response.status}"}

    except HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"✗ HTTP Error {e.code}: {e.reason}")
        print(f"Response: {error_body}")
        return {"error": f"HTTP Error {e.code}: {e.reason}", "details": error_body}

    except URLError as e:
        print(f"✗ URL Error: {e.reason}")
        return {"error": f"URL Error: {e.reason}"}

    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    # Load environment variables from .env file
    load_env_file()

    # Get story ID from command line or use default
    story_id = sys.argv[1] if len(sys.argv) > 1 else "EPMCDMETST-70442"

    result = test_jira_connection(story_id)

    # Exit with appropriate code
    sys.exit(0 if result.get("success") else 1)
