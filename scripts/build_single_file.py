#!/usr/bin/env python3
"""Build the single-file E.Adj Generator.

Injects prompts/eadj-scraper-prompt.md into eadj-generator.html (the
EADJ_SCRAPER_PROMPT placeholder) and runs safety checks:

- the embedded prompt names all 9 sections (s1-s9)
- no duplicate top-level function/var declarations in the <script>
- 0 fetch(, 0 <script src, 0 <link, 0 external URLs in the HTML
- the white PBGC logo data URI is present in the header

Usage:
  python3 scripts/build_single_file.py [--version V]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "eadj-generator.html"
PROMPT = ROOT / "prompts" / "eadj-scraper-prompt.md"


def fail(msg):
    print(f"BUILD FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def main():
    version = None
    if "--version" in sys.argv:
        i = sys.argv.index("--version")
        if i + 1 >= len(sys.argv):
            fail("--version needs a value")
        version = sys.argv[i + 1]

    html = HTML.read_text(encoding="utf-8")
    prompt = PROMPT.read_text(encoding="utf-8")

    # 1. Inject the prompt between the PROMPT markers (idempotent —
    # re-running replaces the previously injected string).
    start = html.find("/* PROMPT-START */")
    end = html.find("/* PROMPT-END */")
    if start < 0 or end < 0 or end <= start:
        fail("prompt markers not found in eadj-generator.html")
    end += len("/* PROMPT-END */")
    replacement = (
        "/* PROMPT-START */\nvar EADJ_SCRAPER_PROMPT = "
        + json.dumps(prompt)
        + ";\n/* PROMPT-END */"
    )
    html = html[:start] + replacement + html[end:]

    # 2. The prompt must name all 9 sections and the key topics.
    for sec in ("s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"):
        if sec not in prompt:
            fail(f"prompt is missing section {sec}")
    for key in ("Plan Termination during Bankruptcy", "UCEBs",
                "§436", "Payee Data Review", "Offsets from Another Plan",
                "Successor Plan Determination", "PC3",
                "Review Benefits Currently in Pay",
                "Funded GL Ratio", "Tables 1"):
        if key not in prompt:
            fail(f"prompt is missing topic: {key}")

    # 3. Version bump, if requested.
    if version:
        html = re.sub(
            r'version: "[^"]*",',
            f'version: "{version}",',
            html,
            count=1,
        )
        html = html.replace("v0.1.0", f"v{version}")

    # 4. No duplicate top-level function/var declarations.
    m = re.search(r"<script>(.*)</script>", html, re.S)
    if not m:
        fail("no <script> block found")
    script = m.group(1)
    seen = {}
    for line in script.splitlines():
        fm = re.match(r"^(?:function|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)", line)
        if fm:
            name = fm.group(1)
            if name in seen:
                fail(f"duplicate top-level declaration: {name}")
            seen[name] = True

    # 5. No external references.
    if "fetch(" in script:
        fail("script contains fetch(")
    if "<script src" in html or "<link" in html:
        fail("HTML contains <script src or <link")
    # OOXML namespace URIs (schemas.openxmlformats.org, purl.org/dc) are
    # identifiers inside the .docx strings, not fetches — strip them
    # before checking.
    clean = html.replace("http://schemas.openxmlformats.org/", "")
    clean = clean.replace("http://purl.org/dc/elements/1.1/", "")
    for pat in ("http://", "https://"):
        if pat in clean:
            fail(f"HTML contains external URL ({pat})")

    # 6. The white PBGC logo must be embedded in the header.
    if "data:image/png;base64," not in html:
        fail("header logo data URI missing")

    HTML.write_text(html, encoding="utf-8")
    print(f"Built {HTML.name}: {len(html)} bytes, prompt embedded ({len(prompt)} chars, 9 sections)")


if __name__ == "__main__":
    main()
