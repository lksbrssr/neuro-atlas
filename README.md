# State of BCI

An interactive dashboard on the state of brain-computer interfaces — devices, clinical trials, funding, and the field's trajectory. Neobank-grade UI, light and dark mode.

**Status:** plumbing only. The shell, theming, and layout primitives are in place; data modules land via PRs.

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
