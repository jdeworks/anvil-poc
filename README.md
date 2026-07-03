# anvil-poc

Public, **self-contained** demo of anvil, automated research and source-trust
analysis. **Live demo: https://jdeworks.github.io/anvil-poc/**

A static Vite + React SPA served by GitHub Pages. **No backend, no keys, nothing
live.** It serves the real, pre-computed analysis output of a few sources, baked
into static JSON.

This repo never imports or modifies the private `anvil` codebase. It only holds
captured *output* (safe to serve raw) plus the viewer.

## What's in the demo

- **Three fully-explorable sources** (one paper, one book, one web URL): summary,
  claims, trust signals (shown as signs with evidence and corroboration),
  qualitative novelty and reproducibility, the extracted source text, citations,
  and a rendered cross-context relevance report.
- **Data sources table**: the catalog roster. The three heroes open; every other
  row shows "Not part of the POC preview".
- **Evaluations**, and **Contexts** featuring two genuinely auto-extracted
  contexts (anvil and the narratu POC) with their full YAML.
- **Why anvil**, **How it works**, and an **investor** page with cited, linked
  industry numbers.
- **Road ahead**: what is built and where it is headed, with product screenshots
  (click to enlarge).
- **Feedback questionnaire** that posts to a Google Form (no backend).

## Develop

```bash
npm install
npm run dev        # http://localhost:4173/anvil-poc/
npm run build      # -> docs/  (committed; Pages serves this)
npm run preview
```

## Refreshing the baked data

The fixtures under `public/demo/` are produced by reading a **local, seeded**
anvil stack (read-only):

```bash
python3 scripts/extract_fixtures.py        # data: hits http://localhost:8000
python3 scripts/capture_screenshots.py     # screenshots: drives localhost:3000
```

`extract_fixtures.py` bakes derived analysis, summaries and metadata, plus short
licensing-safe excerpts of the source text (the full book text and PDFs are not
shipped). `capture_screenshots.py` writes `public/demo/screenshots/` and its
`index.json`.

## Deploy

No CI. Build locally and commit the output; Pages serves it from the branch:

1. `npm run build` (outputs to `docs/`).
2. Commit `docs/`.
3. One-time: repo **Settings, Pages, Source = "Deploy from a branch", Branch =
   `dev`, Folder = `/docs`**. We use `dev`, not `main`.

Live at https://jdeworks.github.io/anvil-poc/. To publish an update: build,
commit `docs/` together with the source change, and push `dev`.

## License

[BSL 1.1](./LICENSE.md). Licensor jdeworks. Converts to Apache 2.0 on the Change
Date. Third-party source excerpts in the demo data remain under their original
owners' copyright.
