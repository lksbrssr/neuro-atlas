# Data

Source datasets for Neuro Atlas. Canonical files live here; the app consumes the slim derivatives in `src/data/` (regenerate with `node scripts/generate-derived.mjs`).

## Ecosystem — external resource

Ecosystem links to the [Neurofounders startup map](https://www.neurofounders.co/resources/start-up-map), maintained by Neurofounders. The copied directory, tags, derived landscape dataset, and Neurofounders-sourced logos were removed from the current tree on **2026-09-11**. The generator no longer imports or republishes their directory. Git history and earlier deployments are not purged by this change.

## `market-memo-q1-2026/` — Q1+ 2026 Global BCI Market Memo

Extracted from the infographic **"Q1+ 2026 Market Memo: Global BCI Industry"** by Patchwise Labs, LLC / Neurotech Futures, in collaboration with PL Neuro. Covers **implanted BCI only, Jan–Apr 2026** (excludes stealth, wearables, related subsets). Source memo: [neurotechnology.substack.com/p/representations2](https://neurotechnology.substack.com/p/representations2) (via bit.ly/Q126BCImemo).

- **`infographic.png`** — the source image itself.
- **`headline_metrics.csv`** — $650m+ new capital, $14b acquisition, 50 global investors, 102% YoY growth, 24 startups, 25+ commercial milestones, 18+ clinical partners, 12 clinical indications, 1 market approval.
- **`capital_by_year.csv`** — Naveen memo comparison cut of *new capital raised* (not valuations): 2024: $260m, 2025: $322m, 2026 (Jan–Apr): $653m. Milestone year-column heroes sum sourced round sizes instead of this series.
- **`milestones.csv`** — 2026 memo rows plus screened 2024–2025 pathway events (BDD / TAP / IDE / FIH / trial / 510(k) / CE), stage-coded (`capital`, `clinical`, `commercial`). The legacy `nf_slug` field is unused; no directory join is performed.
- **`ecosystem_firms.csv`** — the ~54 investors & strategic partners shown, best-effort typed (`vc`, `strategic_medtech`, `hospital`, `regulator`, …) and geolocated. The memo's dotted-line deal attributions are **not** encoded — too ambiguous to assert from the graphic.

Caveats: stage colors were read off the infographic; ~half the milestone rows now carry primary-source links harvested from the memo post (see `provenance.md` for the full sourcing chain and corrections). The memo's own disclaimer applies (PL Neuro may hold financial interest in referenced companies).

## `logos/` — firm logos

Independently sourced company-site icons, favicon-service images, and Wikipedia logos. **`manifest.csv`** maps `slug, name, file, source, source_url, status`. Neurofounders-sourced images have been removed from both this directory and `public/logos/`; unavailable logos use the UI's existing initials fallback. The generator uses only the remaining local manifest for milestone and funding-company logos.

## `glossary/` — acronym tooltips

**`acronyms.csv`** (`acronym, expansion, definition`) — seeded from the memo legend (FIH, BDD, IDE, TAP, JV) plus the acronyms recurring in company descriptions (EEG, MEA, DBS, TMS, fNIRS, ECoG, …). **UI convention: whenever an acronym from this file appears in the dashboard, render it with a tooltip showing expansion + definition.** Extend this file rather than hardcoding tooltips.

## BCI Funding Index

The source-linked, screened capital dataset lives in [`funding-index/`](./funding-index/README.md). `npm run data:generate` writes `src/data/funding-index.json` independently of the external Ecosystem map. Funding records and milestone evidence are preserved; this is not an ecosystem census.
