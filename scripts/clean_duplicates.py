import re

path = r"C:\Users\shubh\.gemini\antigravity\scratch\seenil\web\src\app\cloud\dashboard\page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"        \{/\* =+\n            TAB: 250,000\+ HISTORICAL TELEMETRY DATABASE EXPLORER[\s\S]*?        \)\}"
matches = list(re.finditer(pattern, content))
print(f"Found {len(matches)} historical blocks")

if len(matches) > 1:
    # Keep only the last match
    for m in reversed(matches[:-1]):
        content = content[:m.start()] + content[m.end():]
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Cleaned up duplicates, kept only the final one.")
