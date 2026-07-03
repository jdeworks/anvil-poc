#!/usr/bin/env python3
"""Extract baked demo fixtures from a LOCAL, seeded anvil stack.

One-way, read-only: hits the local anvil API (admin identity) and writes static
JSON into ../public/demo/. The committed output is what the public SPA serves —
there is no backend in the deployed site.

Safety:
  * Strips internal/raw fields by default (raw_text, sections, source_path,
    provenance, source_yaml, …). Pass --include-raw to keep full text for a
    source you own the rights to.
  * Bakes our DERIVED analysis/summary/graph + metadata — not source files.

Usage:
    python scripts/extract_fixtures.py [--api http://localhost:8000] [--include-raw]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ADMIN = "00000000-0000-0000-0000-000000000000"

# Hero sources (real, analysed) chosen from the seeded corpus.
HEROES = [
    {"kind": "paper", "id": "0cde798b-995f-4a58-be72-d4db96d9dcf4"},
    {"kind": "url", "id": "0b43cfae-82e0-454d-8a0c-d40f24e1d940"},
    {"kind": "book", "id": "8b410838-2682-409f-bd6c-9f233d38bee2"},
]

# Contexts to bake. ctx_default is the anvil-author context (rich goals);
# ctx_anvil_v3 is anvil's own codebase scan. Both are "anvil scored against
# itself" — display them under friendly names, anvil first.
# Two genuinely auto-extracted contexts from real codebases (rich source_yaml
# with detected stack + provenance): anvil itself, and the auto-audiobook repo.
CONTEXTS = ["ctx_anvil_v3", "ctx_audiobook_v3"]
DISPLAY_NAME = {
    "ctx_anvil_v3": "anvil",
    "ctx_audiobook_v3": "narratu poc",
    "ctx_default": "default",  # used only as an eval comparison label
}
# Public project page per context, baked into the context JSON when set.
PROJECT_URL = {
    "ctx_audiobook_v3": "https://jdeworks.github.io/narratu-poc/",
}

# Known-junk ingest rows kept out of the public catalog regardless of what
# the API returns.
EXCLUDE_IDS = {
    "2eef31a5-f5a8-41a2-aa7a-d25f348442bd",
    "046cddae-afb9-43f8-b7f9-d3b7e4a23d9c",
    "59ac4f83-b788-48e8-a919-017e218cbc84",
    "7a95b2d8-ad9b-463c-8a25-3185274fbc85",
    "6b40f9cf-e0c4-41e8-8cbc-cbb35666543d",
}

# Site-chrome suffixes scraped into web titles; stripped for the catalog.
TITLE_SUFFIXES = (
    " | Substack", " | Weaviate", " | Mistral AI", " - Microsoft Research",
    " | Amazon Web Services", " - Graph Database & Analytics",
    " - Articles - Braintrust", " - ZenML Blog", " | Towards Data Science",
    " | OpenAI API", " | Vadim's blog",
)


def clean_title(t: str | None) -> str | None:
    for s in TITLE_SUFFIXES:
        if t and t.endswith(s):
            return t[: -len(s)]
    return t


def clean_authors(authors: list | None) -> list:
    """Drop scrape placeholders and split semicolon-joined author strings."""
    out: list[str] = []
    for a in authors or []:
        if not a or a.strip() in ("Author page", "Hi"):
            continue
        out.extend(x.strip() for x in a.split(";") if x.strip())
    return out

CATALOG_LIMIT = 50
CLAIM_LIMIT = 24
METHOD_LIMIT = 12
CITATION_LIMIT = 20
GRAPH_NODE_LIMIT = 140
ABSTRACT_CHARS = 700
# Public bake keeps short excerpts only (third-party text stays with its
# copyright owners); --include-raw lifts this for sources you own rights to.
SECTION_LIMIT = 4
SECTION_CHARS = 1400
RAW_TEXT_CHARS = 2500
CHAPTER_CHARS = 1500
CONTEXT_YAML_CHARS = 14000

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "demo"

API = "http://localhost:8000"
INCLUDE_RAW = False


def get(path: str) -> dict | list | None:
    url = f"{API}{path}"
    req = urllib.request.Request(url, headers={"X-Anvil-User": ADMIN})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        print(f"  ! {path} -> HTTP {e.code}", file=sys.stderr)
    except Exception as e:  # noqa: BLE001
        print(f"  ! {path} -> {e}", file=sys.stderr)
    return None


def write(rel: str, data) -> None:
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"  wrote {rel} ({p.stat().st_size:,} B)")


def trim(s: str | None, n: int) -> str | None:
    if not s:
        return s
    return s if len(s) <= n else s[:n].rstrip() + "…"


# ── shaping (strip internal fields) ─────────────────────────────────────────

def shape_detail(d: dict) -> dict:
    out = {
        "title": d.get("title"),
        "authors": d.get("authors") or [],
        "year": d.get("year"),
        "abstract": trim(d.get("abstract"), ABSTRACT_CHARS),
        "page_count": d.get("page_count"),
        "source_type": d.get("source_type"),
        "source_url": d.get("source_url"),
        "detected_language": d.get("detected_language"),
        "tags": d.get("tags") or [],
    }
    if INCLUDE_RAW:
        out["raw_text"] = d.get("raw_text")
        out["sections"] = d.get("sections")
    return out


def shape_analysis(a: dict) -> dict | None:
    if not a or "claims" not in a and "trustworthiness" not in a:
        return None
    claim_keys = (
        "text", "section_ref", "confidence", "provenance", "validity_confidence",
        "validity_basis", "evidence_strength", "evidence_basis", "evidence_type",
        "scope", "corroboration_verdict", "corroboration_sources",
    )
    claims = [
        {k: c.get(k) for k in claim_keys if k in c}
        for c in (a.get("claims") or [])[:CLAIM_LIMIT]
    ]
    methods = [
        {k: m.get(k) for k in ("name", "description", "confidence") if k in m}
        for m in (a.get("methods") or [])[:METHOD_LIMIT]
    ]
    return {
        "status": a.get("status"),
        "confidence": a.get("confidence"),
        "claims": claims,
        "methods": methods,
        "novelty": a.get("novelty"),
        "reproducibility": a.get("reproducibility"),
        "trustworthiness": a.get("trustworthiness"),
        "tool_stack": a.get("tool_stack") or [],
        "claim_total": len(a.get("claims") or []),
        "method_total": len(a.get("methods") or []),
    }


def shape_content_from_detail(d: dict, kind: str = "paper") -> dict | None:
    """Extracted source text for the Source tab: top-level sections (preferred)
    or a leading slice of raw_text. These are excerpts, not the full document.

    Web articles are usually one long section, so for `url` we use the flowing
    raw_text to avoid the text looking cut off mid-article."""
    sec_limit = 25 if INCLUDE_RAW else SECTION_LIMIT
    raw_chars = 18000 if INCLUDE_RAW else RAW_TEXT_CHARS
    note = None if INCLUDE_RAW else (
        "The full text isn't reproduced in this public demo — these are short "
        "excerpts. Read the original via the link above."
    )

    def with_note(content: dict) -> dict:
        if note:
            content["license_note"] = note
        return content

    if kind == "url":
        raw = d.get("raw_text")
        if raw:
            return with_note({"text": trim(raw, raw_chars)})
    sections = d.get("sections") or []
    if sections:
        out = []
        for s in sections[:sec_limit]:
            content = trim(s.get("content"), SECTION_CHARS)
            if not content and not s.get("heading"):
                continue
            out.append({
                "heading": s.get("heading"),
                "level": s.get("level"),
                "content": content,
            })
        if out:
            return with_note({"sections": out})
    raw = d.get("raw_text")
    if raw:
        return with_note({"text": trim(raw, raw_chars)})
    return None


def shape_summary(s: dict) -> dict | None:
    arr = (s or {}).get("summaries") or []
    if not arr:
        return None
    m = arr[0]
    return {
        "extractor_method": m.get("extractor_method"),
        "summary_text": m.get("summary_text"),
        "verdict": m.get("verdict"),
        "confidence": m.get("confidence"),
        "general_claim": m.get("general_claim"),
        "key_findings": m.get("key_findings") or [],
        "stats": m.get("stats") or {},
    }


def drop_self_corroboration(analysis: dict | None, detail: dict) -> dict | None:
    """A corroboration entry whose only evidence URL is the source's own page
    isn't independent support — drop such trust reasons (rebalancing the score
    so base + deltas stays exact) and claim corroborations."""
    if not analysis:
        return analysis
    t = analysis.get("trustworthiness")
    if not isinstance(t, dict):
        return analysis
    own = []
    src = detail.get("source_url") or ""
    if src:
        own.append(src.rstrip("/"))
        m = re.search(r"arxiv\.org/(?:abs|html|pdf)/([0-9.]+)", src)
        if m:
            own.append(m.group(1))

    def is_self(url: str | None) -> bool:
        return bool(url) and any(o in url for o in own)

    if own and t.get("reasons"):
        kept, removed_delta = [], 0.0
        for r in t["reasons"]:
            if r.get("kind") == "corroboration" and is_self(r.get("url")):
                removed_delta += r.get("delta") or 0
            else:
                kept.append(r)
        if removed_delta and isinstance(t.get("score"), (int, float)):
            t["score"] = round(t["score"] - removed_delta, 4)
        t["reasons"] = kept
    if own and t.get("claim_corroborations"):
        t["claim_corroborations"] = [
            c for c in t["claim_corroborations"]
            if not (c.get("sources") and all(is_self(s) for s in c["sources"]))
        ]
    return analysis


def redact_yaml(yaml_text: str | None) -> str | None:
    """The auto-extracted context YAML can embed a verbatim Dockerfile excerpt
    that documents where credentials live in the image. Not fit for the public
    demo — replace the excerpt (and the credential-location rationale) while
    keeping the rest of the context detail."""
    if not yaml_text:
        return yaml_text
    yaml_text = re.sub(
        r'- "FROM .*?\(backend/Dockerfile\)"',
        '- "(backend/Dockerfile — excerpt redacted for the public demo)"',
        yaml_text,
        flags=re.S,
    )
    yaml_text = re.sub(
        r"rationale: Dockerfile installs the claude-code apt package from "
        r"downloads\.claude\.ai and bakes \n\s*in OAuth credentials under "
        r"/root/\.claude, indicating",
        "rationale: Dockerfile installs the Claude Code subscription CLI, indicating",
        yaml_text,
    )
    return yaml_text


def friendly_markdown(md: str | None) -> str | None:
    """Evaluation reports embed internal context names (Context: ctx_anvil_v3,
    sensitivity table rows, provenance lines) — map them to display names."""
    if not md:
        return md
    for name, disp in DISPLAY_NAME.items():
        md = md.replace(name, disp)
    return md


def shape_citations(c: dict) -> list:
    keys = ("kind", "raw_text", "resolved_title", "resolved_year", "doi", "canonical_url")
    return [
        {k: it.get(k) for k in keys if k in it}
        for it in (c or {}).get("citations", [])[:CITATION_LIMIT]
    ]


def shape_graph(g: dict) -> dict | None:
    # anvil's graph edges use src/dst/relation keys; nodes are section:* and
    # claim:* with a `type`. Cap nodes for legibility and keep edges within set.
    graph = (g or {}).get("graph") or {}
    nodes = graph.get("nodes") or []
    if not nodes:
        return None
    keep_ids = set()
    out_nodes = []
    for n in nodes[:GRAPH_NODE_LIMIT]:
        keep_ids.add(n.get("id"))
        out_nodes.append({
            "id": n.get("id"),
            "type": n.get("type"),
            "label": trim(n.get("label"), 120),
            "summary": trim(n.get("summary"), 280),
        })
    out_edges = []
    for e in graph.get("edges") or []:
        s = e.get("src") or e.get("source")
        t = e.get("dst") or e.get("target")
        if s in keep_ids and t in keep_ids:
            out_edges.append({
                "source": s,
                "target": t,
                "relationship": e.get("relation") or e.get("relationship"),
                "weight": e.get("weight"),
            })
    return {"nodes": out_nodes, "edges": out_edges}


# ── per-hero bundles ────────────────────────────────────────────────────────

def existing_markdown(ro_id: str) -> dict[str, str]:
    """Preserve already-baked evaluation reports keyed by context_id, so a
    transient report-endpoint failure doesn't wipe the relevance reports."""
    p = OUT / "source" / f"{ro_id}.json"
    if not p.exists():
        return {}
    try:
        old = json.loads(p.read_text())
        return {
            e.get("context_id"): e.get("markdown")
            for e in old.get("evaluations", [])
            if e.get("markdown")
        }
    except Exception:  # noqa: BLE001
        return {}


def bundle_paper(kind: str, ro_id: str) -> dict | None:
    detail = get(f"/api/papers/{ro_id}")
    if not detail:
        return None
    summary = shape_summary(get(f"/api/papers/{ro_id}/summary") or {})
    analysis = drop_self_corroboration(
        shape_analysis(get(f"/api/papers/{ro_id}/analysis") or {}), detail,
    )
    citations = shape_citations(get(f"/api/papers/{ro_id}/citations") or {})
    graph = shape_graph(get(f"/api/papers/{ro_id}/graph") or {})
    prev_md = existing_markdown(ro_id)

    evals = []
    for ev in detail.get("evaluations", []):
        ctx_id = ev.get("context_id")
        rep = get(f"/api/papers/{ro_id}/contexts/{ctx_id}") or {}
        ocs = [
            {"ctx_name": DISPLAY_NAME.get(o.get("ctx_name"), o.get("ctx_name")),
             "score_overall": o.get("score_overall")}
            for o in (rep.get("other_context_scores") or [])
        ]
        evals.append({
            "context_id": ctx_id,
            "context_name": DISPLAY_NAME.get(ev.get("context_name"), ev.get("context_name")),
            "score_overall": ev.get("score_overall"),
            "markdown": friendly_markdown(rep.get("markdown") or prev_md.get(ctx_id)),
            "other_context_scores": ocs,
        })

    return {
        "kind": kind,
        "id": ro_id,
        "detail": shape_detail(detail),
        "content": shape_content_from_detail(detail, kind),
        "summary": summary,
        "analysis": analysis,
        "citations": citations,
        "graph": graph,
        "evaluations": evals,
    }


def bundle_book(work_id: str) -> dict | None:
    work = get(f"/api/works/{work_id}")
    if not work:
        return None
    clusters = work.get("clusters") or []
    detail = {
        "title": work.get("title"),
        "authors": work.get("authors") or [],
        "year": work.get("year"),
        "source_type": work.get("source_type"),
        "page_count": work.get("page_count"),
        "cluster_count": work.get("cluster_count"),
        "clusters": [
            {
                "title": c.get("title"),
                "summary_verdict": c.get("summary_verdict"),
                "novelty": c.get("novelty"),
                "reproducibility": c.get("reproducibility"),
                "relevancy": c.get("relevancy"),
            }
            for c in clusters[:40]
        ],
    }
    # Representative chapter: first complete CONTENT cluster → its
    # analysis/summary/graph. Front matter (foreword, contributor bios, ToC)
    # produces analysis about the book's packaging, not its content — baking
    # that as the book's trust signals is misleading, so skip it.
    front_matter = re.compile(
        r"introduction, metadata|foreword|table of contents|copyright|contributors",
        re.I,
    )
    rep_id = next(
        (c.get("research_object_id") for c in clusters
         if c.get("eval_status") == "complete" and c.get("research_object_id")
         and not front_matter.search(c.get("title") or "")),
        clusters[0].get("research_object_id") if clusters else None,
    )
    summary = analysis = graph = None
    if rep_id:
        summary = shape_summary(get(f"/api/papers/{rep_id}/summary") or {})
        analysis = shape_analysis(get(f"/api/papers/{rep_id}/analysis") or {})
        graph = shape_graph(get(f"/api/papers/{rep_id}/graph") or {})

    # Short excerpts from the first 3 chapters (copyrighted book — no full text).
    chapters = []
    for c in clusters:
        rid = c.get("research_object_id")
        if not rid:
            continue
        cd = get(f"/api/papers/{rid}") or {}
        text = cd.get("raw_text")
        if not text:
            secs = cd.get("sections") or []
            text = "\n\n".join((s.get("content") or "") for s in secs[:3])
        if text and text.strip():
            chapters.append({"title": c.get("title"), "text": trim(text, CHAPTER_CHARS)})
        if len(chapters) >= 3:
            break
    content = {
        "chapters": chapters,
        "license_note": (
            "This is a copyrighted book, so the full text and PDF can't be shown "
            "on this public demo. These are short excerpts from the opening chapters."
        ),
    } if chapters else None

    return {
        "kind": "book",
        "id": work_id,
        "detail": detail,
        "content": content,
        "summary": summary,
        "analysis": analysis,
        "citations": [],
        "graph": graph,
        "evaluations": [],
    }


# ── catalog roster (papers + works merged) ──────────────────────────────────

FACET_KIND = {"paper": "paper", "blog": "url", "url": "url", "book": "book"}

_kind_cache: dict[str, tuple[str, str]] = {}


def kind_of(ro: str) -> tuple[str, str]:
    """(kind, source_type) for a research object, via a light detail lookup."""
    if ro in _kind_cache:
        return _kind_cache[ro]
    d = get(f"/api/papers/{ro}") or {}
    st = d.get("source_type") or "pdf"
    if st == "epub":
        kind = "book"
    elif st in ("html", "rss") or d.get("source_url"):
        kind = "url"
    else:
        kind = "paper"
    _kind_cache[ro] = (kind, st)
    return kind, st


def build_catalog(
    score_by_ro: dict,
    claim_by_ro: dict,
    hero_refs: list[dict],
    total: int,
    eval_meta: dict,
) -> dict:
    by_id: dict[str, dict] = {}
    hero_ids = {h["id"] for h in hero_refs}

    def add(row: dict) -> None:
        if row["id"] and row["id"] not in by_id and row["id"] not in EXCLUDE_IDS:
            row["title"] = clean_title(row.get("title"))
            row["authors"] = clean_authors(row.get("authors"))
            by_id[row["id"]] = row

    # Heroes first so they always appear (the corpus list may not include them).
    for h in hero_refs:
        add({
            "id": h["id"],
            "kind": h["kind"],
            "title": h["title"],
            "authors": [],
            "year": None,
            "facet": h.get("facet") or h["kind"],
            "source_type": h.get("facet"),
            "score_overall": score_by_ro.get(h["id"]),
            "tldr": trim(claim_by_ro.get(h["id"]), 160),
            "added_at": None,
            "hero": True,
        })

    # Evaluated papers next — these are the scored rows (the corpus's recent
    # list is mostly unscored ingests), sorted to the top below.
    for ro, meta in eval_meta.items():
        if ro in by_id:
            continue
        kind, st = kind_of(ro)
        add({
            "id": ro,
            "kind": kind,
            "title": meta.get("title"),
            "authors": meta.get("authors") or [],
            "year": meta.get("year"),
            "facet": st,
            "source_type": st,
            "score_overall": score_by_ro.get(ro),
            "tldr": trim(claim_by_ro.get(ro), 160),
            "added_at": None,
            "hero": False,
        })

    papers = get(f"/api/papers?limit={CATALOG_LIMIT}") or {}
    for it in papers.get("items", []):
        ro = it.get("research_object_id")
        facet = it.get("source_facet") or "paper"
        add({
            "id": ro,
            "kind": FACET_KIND.get(facet, "paper"),
            "title": it.get("title"),
            "authors": it.get("authors") or [],
            "year": it.get("year"),
            "facet": facet,
            "source_type": it.get("source_type"),
            "score_overall": score_by_ro.get(ro),
            "tldr": trim(claim_by_ro.get(ro), 160),
            "added_at": it.get("added_at"),
            "hero": ro in hero_ids,
        })
    works = get("/api/works?limit=12") or {}
    for it in works.get("items", []):
        wid = it.get("id")
        add({
            "id": wid,
            "kind": "book",
            "title": it.get("title"),
            "authors": it.get("authors") or [],
            "year": it.get("year"),
            "facet": "book",
            "source_type": it.get("source_type"),
            "score_overall": score_by_ro.get(wid),
            "tldr": trim(claim_by_ro.get(wid), 160),
            "added_at": None,
            "hero": wid in hero_ids,
        })

    # Drop rows with unreadable titles (e.g. raw sha256 hashes, empty) unless hero.
    def readable(t: str | None) -> bool:
        t = (t or "").strip()
        if len(t) < 3:
            return False
        if re.fullmatch(r"[0-9a-fA-F]{24,}", t):  # hash-like
            return False
        if re.match(r"arXiv:\d{4}\.\d+", t):  # raw arXiv id as title
            return False
        return True

    rows = [r for r in by_id.values() if r["hero"] or readable(r.get("title"))]
    # Heroes first, then scored rows by score desc, then the rest by title.
    rows.sort(key=lambda r: (not r["hero"], -(r["score_overall"] or 0), r["title"] or ""))
    return {"items": rows, "total": max(total, len(rows))}


def main() -> int:
    global API, INCLUDE_RAW
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default=API)
    ap.add_argument("--include-raw", action="store_true")
    args = ap.parse_args()
    API = args.api.rstrip("/")
    INCLUDE_RAW = args.include_raw

    print(f"Extracting from {API} → {OUT}")
    OUT.mkdir(parents=True, exist_ok=True)

    # stats + overview + full evaluations (for scores / claims / top picks)
    stats = get("/api/public/stats") or {"counts": {}, "highlights": []}
    overview = get("/api/overview") or {}
    evals_full = get("/api/evaluations?limit=200") or {}
    # Drop test-artifact contexts (e.g. ctx_wp9_test) so they never surface.
    eval_items = [
        ev for ev in (evals_full.get("items") or [])
        if "test" not in (ev.get("context_name") or "").lower()
    ]

    score_by_ro: dict[str, float] = {}
    claim_by_ro: dict[str, str] = {}
    eval_meta: dict[str, dict] = {}
    for ev in eval_items:
        ro = ev.get("research_object_id")
        sc = ev.get("score_overall")
        if not ro:
            continue
        if sc is not None and sc > score_by_ro.get(ro, -1):
            score_by_ro[ro] = sc
        eval_meta.setdefault(ro, {
            "title": ev.get("title"),
            "authors": ev.get("authors"),
            "year": ev.get("year"),
        })
    top_picks = overview.get("top_picks") or []
    for tp in top_picks:
        if tp.get("ro_id"):
            claim_by_ro[tp["ro_id"]] = tp.get("general_claim") or tp.get("summary_text")
        if tp.get("context_name") in DISPLAY_NAME:
            tp["context_name"] = DISPLAY_NAME[tp["context_name"]]
    for h in stats.get("highlights", []):
        claim_by_ro.setdefault(h.get("ro_id"), h.get("general_claim"))
    stats["top_picks"] = top_picks
    # Reproduction candidates count (a real, non-zero figure for the dashboard).
    candidates = get("/api/experiments/candidates")
    if isinstance(candidates, list):
        stats.setdefault("counts", {})["candidates"] = len(candidates)
    write("stats.json", stats)

    # evaluations list (clean rows — no internal source_path / score ids)
    ev_keys = (
        "research_object_id", "title", "authors", "year", "context_name",
        "context_id", "score_overall", "adoption_cost", "evaluated_at", "tags",
    )

    def ev_row(ev: dict) -> dict:
        row = {k: ev.get(k) for k in ev_keys}
        row["context_name"] = DISPLAY_NAME.get(ev.get("context_name"), ev.get("context_name"))
        return row

    write("evaluations.json", [ev_row(ev) for ev in eval_items[:60]])

    # contexts — full analysis, with friendly display names (anvil first).
    ctx_refs = []
    for name in CONTEXTS:
        c = get(f"/api/contexts/{name}")
        if not c:
            continue
        disp = DISPLAY_NAME.get(name, c.get("name"))
        ctx_refs.append({"id": c.get("id"), "name": name, "display_name": disp})
        write(f"context/{name}.json", {
            "id": c.get("id"),
            "name": name,
            "display_name": disp,
            "project_url": PROJECT_URL.get(name),
            "organization": c.get("organization"),
            "tech_stack": c.get("tech_stack"),
            "constraints": c.get("constraints"),
            "goals": c.get("goals"),
            "paper_count": c.get("paper_count"),
            "source_yaml": trim(redact_yaml(c.get("source_yaml")), CONTEXT_YAML_CHARS),
        })

    # hero bundles
    hero_refs = []
    hero_ids = {h["id"] for h in HEROES}
    for h in HEROES:
        print(f"hero: {h['kind']} {h['id']}")
        b = bundle_book(h["id"]) if h["kind"] == "book" else bundle_paper(h["kind"], h["id"])
        if not b:
            print(f"  ! skipped {h['id']}", file=sys.stderr)
            continue
        write(f"source/{h['id']}.json", b)
        hero_refs.append({
            "kind": h["kind"],
            "id": h["id"],
            "title": b["detail"].get("title"),
            "facet": b["detail"].get("source_type") or h["kind"],
        })

    # catalog
    total_papers = (stats.get("counts") or {}).get("papers") or 0
    write("catalog.json", build_catalog(
        score_by_ro, claim_by_ro, hero_refs, total_papers, eval_meta,
    ))

    # manifest
    write("manifest.json", {
        "id": "anvil-poc",
        "title": "anvil — research & source trust analysis",
        "description": "Public static demo. Real analysis output, baked. No backend.",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "generatedWith": "scripts/extract_fixtures.py",
        "stats": stats.get("counts", {}),
        "heroes": hero_refs,
        "contexts": ctx_refs,
    })

    print("done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
