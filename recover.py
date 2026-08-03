import json
import re

log_file = r"C:\Users\Dell\.gemini\antigravity-ide\brain\40972d39-8e47-4faa-932b-b4d7ae590757\.system_generated\logs\transcript_full.jsonl"
with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line.strip())
            # Search for any tool outputs or inputs related to oauth_service.py
            if "tool_responses" in data:
                for tr in data.get("tool_responses", []):
                    output = tr.get("response", {}).get("output", "")
                    if "oauth_service.py" in output and "def generate_google_login_url" in output:
                        print("FOUND OAUTH_SERVICE IN TOOL RESPONSE!")
                        print(output)
        except Exception as e:
            pass
