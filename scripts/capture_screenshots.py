#!/usr/bin/env python3
"""Capture screenshots of the live anvil frontend for the demo's "Road ahead"
gallery. Read-only: drives a headless Chromium over http://localhost:3000 and
writes PNGs + index.json into ../public/demo/screenshots/.

Does NOT touch the anvil repo (anvil's own qa_screenshots.py writes into the
anvil tree; this one writes here). Requires the anvil frontend up and Playwright
with Chromium installed.

    python3 scripts/capture_screenshots.py
"""
from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
ADMIN = "00000000-0000-0000-0000-000000000000"
PDF_RO = "0cde798b-995f-4a58-be72-d4db96d9dcf4"

OUT = Path(__file__).resolve().parent.parent / "public" / "demo" / "screenshots"

# (file, path, caption, group, clicks, full_page) — `clicks` are button/tab
# texts to click (best-effort) before the shot.
CTX = "ctx_anvil_v3"
SHOTS = [
    ("sources.png", "/sources", "Unified data sources: papers, books and web in one corpus", "Built today", [], False),
    ("paper-detail.png", f"/papers/{PDF_RO}", "Full source analysis: claims, trust, novelty, citations", "Built today", [], False),
    ("evaluations.png", "/evaluations", "Evaluations: every source scored against a context", "Built today", [], False),
    ("context-yaml.png", f"/contexts/{CTX}", "A context auto-extracted from a real codebase, with its full definition", "Built today", ["Raw YAML"], True),
]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    written = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )
        # Seed admin identity + dark theme before any app script runs.
        ctx.add_init_script(
            f"""
            try {{
              localStorage.setItem('anvil.activeUser', '{ADMIN}');
              localStorage.setItem('anvil:palette', 'mono');
              localStorage.setItem('anvil:palette-mode', 'dark');
            }} catch (e) {{}}
            """
        )
        page = ctx.new_page()
        for file, path, caption, group, clicks, full in SHOTS:
            try:
                page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=30_000)
                page.wait_for_timeout(2500)  # let late client fetches land
                for label in clicks:
                    try:
                        page.get_by_text(label, exact=False).first.click(timeout=5_000)
                        page.wait_for_timeout(2000)
                    except Exception as ce:  # noqa: BLE001
                        print(f"    (click '{label}' skipped: {ce})")
                page.screenshot(path=str(OUT / file), full_page=full)
                written.append({"file": file, "caption": caption, "group": group})
                print(f"  captured {file}")
            except Exception as e:  # noqa: BLE001
                print(f"  ! {path} -> {e}")
        browser.close()

    (OUT / "index.json").write_text(json.dumps(written, indent=2))
    print(f"wrote {len(written)} shots + index.json → {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
