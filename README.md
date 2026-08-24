# Neuro Atlas

An interactive atlas of the brain-computer interface field — milestones, capital, velocity, landscape, and the people building it. Neobank-grade UI, light and dark mode.

**Status:** taking shape. The atlas is organized as **plates** — tabs that each open their own dashboard: Milestones (2026 Zeitstrahl), Landscape (faceted 363-company explorer), Velocity (field instruments with drag-to-measure sparklines), Capital, Pipeline, Geopolitics, Expectations, People, Access, and Methodology. Canonical data lives in `data/` (CSV/JSON with provenance); `scripts/generate-derived.mjs` builds the slim `src/data/*.json` the app consumes.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com) — design tokens in `src/app/globals.css`
- [next-themes](https://github.com/pacocoursey/next-themes) — class-based light/dark with system default

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

```
src/
  app/
    layout.tsx        # Root layout + ThemeProvider
    page.tsx          # Dashboard shell (placeholder modules)
    globals.css       # Design tokens (light/dark), card primitive
  components/
    site-header.tsx   # Sticky header + theme toggle
    theme-provider.tsx
    theme-toggle.tsx
    stat-card.tsx     # Headline metric card
    placeholder-panel.tsx
```

## Design language

- Surfaces: soft neutral background, white/near-black cards, 1px borders, `rounded-2xl`-ish radii, restrained shadows
- Accent: neural violet (`--accent`)
- Numbers: always tabular (`.tnum`)
- All tokens are CSS variables — restyle in one file

## Deploy

Hosted on Vercel; pushes to `main` deploy to production, PRs get preview URLs.
