# Ecosystem → Neurofounders link verification

Runtime revision: `54c341a5ca3e30df6d8871b19f6bdc77f24aaa7d`.

- Homepage and desktop/mobile navigation link to https://www.neurofounders.co/resources/start-up-map, attributed to Neurofounders, with new-tab labeling and `noopener noreferrer`.
- Existing `/ecosystem` bookmarks return HTTP 307 with that exact Location.
- Native browser click opens the exact target in a new tab and leaves the Atlas page open. External page content was checked separately via an unauthenticated web fetch.
- Chrome checks at 1440, 390 and 320 px: viewport widths match, no page overflow, Ecosystem tile fits, and no old internal Ecosystem links remain.
- Funding, Milestones and Methodology render; no broken images or Neurofounders CDN image requests in checked views.
- 88 tests pass; typecheck, production build and changed-file ESLint pass. Full ESLint retains three pre-existing errors in unchanged `milestone-timeline.tsx` and `theme-toggle.tsx`.
- Funding and milestone JSON are exactly equal to the base revision after excluding logo fields. Field-velocity and auth source files are unchanged.
- Independent code review: PASS on the runtime revision; no material issues.

## Screenshot provenance

These are **local Chrome screenshots**, not hosted-preview captures. The screenshot worktree uses the same runtime source plus an uncommitted loopback-only auth fixture. That fixture is not part of the PR; deployed authentication is unchanged.

- `home-1440.png`: desktop homepage and navigation.
- `ecosystem-390.png`: mobile Ecosystem tile with credit and new-tab indication.
- `funding-1440.png`: existing initials fallback after removing directory-sourced logos.

## Removal boundary

This change removes the raw directory CSV/JSON/tags, derived landscape, explorer, generator joins and directory-sourced logo files from the current tree. It does **not** purge historical commits, old preview deployments, or historical screenshots. No force-push, history rewrite, production merge, or contact with Neurofounders is included.
