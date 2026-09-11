# Landing-page redesign — verification

Application revision: `ce7f2ad` (parent/base: `937a5e5`). Evidence-only commits do not change the rendered app.

## Scope

- Removes the four context-free snapshot figures and their landing-page dependency.
- Replaces the BCI-only, width-constrained headline with **Neurotechnology, mapped.** The atlas is neuro-wide; the BCI Funding Index retains its narrower name and description.
- Reuses the plates' ink-black header language for the hero and four large navigation tiles. Two columns from 640px; one column on phones.
- Adds lightweight, decorative SVG illustrations: timeline, company network, capital connections, and a signal motif. They carry no readings, axes, dates, or live-data claims and are hidden from assistive technology.
- Adds an Explore anchor that scrolls and transfers focus to the directory, plus a GitHub new-pull-request link for feedback, corrections, and data contributions.
- Keeps the four routes, methodology, sidebar, auth, data, and legal footer unchanged.

## Executed checks

- `npm ci` using the existing npm lockfile.
- `npm test`: **86 passing**, including real server-rendered landing DOM tests. Each new behavior test was observed failing before implementation.
- `npm run typecheck`: pass.
- `npm run build`: pass, including the real auth proxy, no local fixture.
- Touched-file ESLint and `git diff --check`: pass.
- Full-repository ESLint still reports **three pre-existing errors** in `milestone-timeline.tsx` and `theme-toggle.tsx`; both files are byte-identical to the base. No dependencies or lint settings changed.
- Actual Chrome checks at **320, 390, 768, 1024, and 1440px**. All four tiles remain reachable; correct 2×2/stacked geometry; no document overflow; full headline glyph bounds stay within the heading. Desktop headings are one line. A reproduced 320px clipping bug was fixed and the same failing browser assertion now passes.
- Native Explore click updates the hash and focuses the directory; Tab reaches the first tile with a visible focus outline.
- Native clicks on all four tiles reach the expected route and a rendered heading.
- Actual theme toggle: light → dark → light, with screenshots.
- Emulated reduced-motion preference disables transitions.
- Landing load: no captured console errors, window errors, or unhandled rejections.
- GitHub `/compare` destination responds HTTP 200.

Browser scripts: `scripts/qa/landing-browser.py` and `scripts/qa/landing-interactions.py`; execute via `browser-harness` stdin with an owned `BU_NAME` against the documented localhost QA listener.

## Screenshot provenance and limits

Screenshots in `docs/screenshots/landing/` are **actual local Chrome captures**, not mockups, against an isolated production build matching application revision `ce7f2ad`. That disposable worktree alone has the established uncommitted local auth fixture and a listener bound to `127.0.0.1`. The release branch retains the original hosted auth gate byte-for-byte.

The repository's homepage URL is stale. The latest GitHub production-deployment record was inspected directly, but its hosted page did not provide an authenticated browser view in this session. Therefore these images do **not** claim authenticated hosted QA. The pull request's Vercel check is reported separately; nothing is merged or published to production by this task.

The existing npm dependency audit flags are unchanged and are not addressed by this visual-only patch.
