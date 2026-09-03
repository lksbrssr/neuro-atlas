# Data

Source datasets for Neuro Atlas. Canonical files live here; the app consumes the slim derivatives in `src/data/` (regenerate with `node scripts/generate-derived.mjs`).

## `neurofounders/` — Neurotech company landscape

Scraped from the [Neurofounders Start-up Map](https://www.neurofounders.co/resources/start-up-map) (list pages + all company detail pages) on **2026-08-24**. 363 companies.

- **`companies.csv` / `companies.json`** — one row per company:
  `slug, name, country, category, tags, founded, funding_stage, modality, form_factor, interface_depth, indication, target_user, regulatory_stage, description, analyst_note, website, profile_url, logo_url, related_slugs`
- **`company_tags.csv`** — long format (`slug, name, tag`) for easy group-bys.

Field coverage is 100% except `website` (362/363). `funding_stage` values: Bootstrapped, Non-dilutive, Pre-seed, Seed, Series A/B/C+, Public, Acquired, Unknown, Defunct. Logo URLs point at the Neurofounders CDN.

## `market-memo-q1-2026/` — Q1+ 2026 Global BCI Market Memo

Extracted from the infographic **"Q1+ 2026 Market Memo: Global BCI Industry"** by Patchwise Labs, LLC / Neurotech Futures, in collaboration with PL Neuro. Covers **implanted BCI only, Jan–Apr 2026** (excludes stealth, wearables, related subsets). Source memo: [neurotechnology.substack.com/p/representations2](https://neurotechnology.substack.com/p/representations2) (via bit.ly/Q126BCImemo).

- **`infographic.png`** — the source image itself.
- **`headline_metrics.csv`** — $650m+ new capital, $14b acquisition, 50 global investors, 102% YoY growth, 24 startups, 25+ commercial milestones, 18+ clinical partners, 12 clinical indications, 1 market approval.
- **`capital_by_year.csv`** — 2024: $260m, 2025: $322m, 2026 (Jan–Apr): $653m.
- **`milestones.csv`** — 27 firm-level milestone rows across 24 startups, stage-coded per the memo legend (`capital` = green, `clinical` = red, `commercial` = yellow). `nf_slug` joins to `neurofounders/companies.csv` (20/24 firms match).
- **`ecosystem_firms.csv`** — the ~54 investors & strategic partners shown, best-effort typed (`vc`, `strategic_medtech`, `hospital`, `regulator`, …) and geolocated. The memo's dotted-line deal attributions are **not** encoded — too ambiguous to assert from the graphic.

Caveats: stage colors were read off the infographic; ~half the milestone rows now carry primary-source links harvested from the memo post (see `provenance.md` for the full sourcing chain and corrections). The memo's own disclaimer applies (PL Neuro may hold financial interest in referenced companies).

## `logos/` — firm logos

One image per market-memo firm where a real logo could be sourced (63/77). Priority: Neurofounders CDN → company-site icons → Google/DuckDuckGo favicon services → Wikipedia. **`manifest.csv`** maps `slug, name, file, source, source_url, status`; 14 firms (mostly China-based funds without confirmable domains, plus Envoy Medical, EpiAneura, CORAL) are `not_found` — their marks are visible in `market-memo-q1-2026/infographic.png`. Neurofounders company logos are *not* duplicated here; use `logo_url` in the companies data.

## `glossary/` — acronym tooltips

**`acronyms.csv`** (`acronym, expansion, definition`) — seeded from the memo legend (FIH, BDD, IDE, TAP, JV) plus the acronyms recurring in company descriptions (EEG, MEA, DBS, TMS, fNIRS, ECoG, …). **UI convention: whenever an acronym from this file appears in the dashboard, render it with a tooltip showing expansion + definition.** Extend this file rather than hardcoding tooltips.

## BCI Funding Index

The source-linked, screened capital dataset lives in [`funding-index/`](./funding-index/README.md). It is additive to the 363-company landscape: `npm run data:generate` writes both `src/data/landscape.json` and `src/data/funding-index.json`, and the funding screen never removes or rewrites ecosystem companies.
