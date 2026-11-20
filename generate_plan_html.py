import markdown
import os

source_md = r"C:\Users\shubh\.gemini\antigravity\scratch\seenil\docs\PHASE_2_TECHNICAL_PLAN.md"
with open(source_md, "r", encoding="utf-8") as f:
    text = f.read()

try:
    html_body = markdown.markdown(text, extensions=["tables", "fenced_code"])
except Exception:
    import html
    html_body = "<pre>" + html.escape(text) + "</pre>"

css = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
body { font-family: 'Inter', sans-serif; background: #F8FAFC; color: #0F172A; padding: 40px 20px; line-height: 1.6; }
.container { max-width: 960px; margin: 0 auto; background: #FFF; padding: 48px; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.print-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #E2E8F0; }
.btn { background: #1D4A8A; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: inherit; font-size: 13px; }
.btn:hover { background: #163B70; }
h1 { font-size: 26px; color: #0A1A3F; margin-bottom: 8px; font-weight: 800; letter-spacing: -0.02em; }
h2 { font-size: 19px; color: #0A1A3F; margin-top: 32px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #E2E8F0; font-weight: 700; }
h3 { font-size: 15px; color: #1E293B; margin-top: 18px; margin-bottom: 8px; font-weight: 600; }
p, li { font-size: 14px; color: #334155; margin-bottom: 10px; }
pre { background: #0A1A3F; color: #5EE6F0; padding: 16px; border-radius: 10px; font-family: 'JetBrains Mono', monospace; font-size: 12px; overflow-x: auto; margin: 16px 0; }
code { font-family: 'JetBrains Mono', monospace; font-size: 12px; background: #F1F5F9; color: #0F172A; padding: 2px 6px; border-radius: 4px; }
pre code { background: transparent; color: inherit; padding: 0; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
th, td { border: 1px solid #E2E8F0; padding: 10px 14px; text-align: left; }
th { background: #F8FAFC; font-weight: 600; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
tr:nth-child(even) { background: #FAFAFA; }
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-family: 'JetBrains Mono', monospace; font-weight: 600; background: #EFF6FF; color: #1D4A8A; border: 1px solid #BFDBFE; }
@media print { body { background: white; padding: 0; } .container { box-shadow: none; border: none; padding: 0; } .print-bar { display: none; } }
"""

full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>SEENIL — Phase 2 Technical Plan (Team 64 - CTRL404)</title>
<style>{css}</style>
</head>
<body>
<div class="container">
<div class="print-bar">
  <div>
    <span class="badge">CICADA 2026 · PROBLEM STATEMENT 64</span>
    <span class="badge" style="background:#ECFDF5; color:#065F46; border-color:#A7F3D0; margin-left:8px;">TEAM CTRL404</span>
  </div>
  <button class="btn" onclick="window.print()">Print / Save as PDF</button>
</div>
{html_body}
</div>
</body>
</html>"""

paths = [
    r"C:\Users\shubh\.gemini\antigravity\scratch\seenil\SEENIL_Phase2_Technical_Plan_Team64.html",
    r"C:\Users\shubh\Downloads\SEENIL_Phase2_Technical_Plan_Team64.html"
]

for p in paths:
    with open(p, "w", encoding="utf-8") as f:
        f.write(full_html)
    print("Created:", p)
