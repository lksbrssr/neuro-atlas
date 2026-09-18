# Disclaimer wording — September 16, 2026

Replaced only the shared footer paragraph with the owner's exact supplied text. Styling, seven links, data, authentication, and page behavior are unchanged. `tests/site-footer.test.mjs` pins the entire rendered paragraph, not only selected clauses.

## Verification

- Exact-copy regression failed on the original wording, then passed after replacement.
- 106 tests pass; typecheck, changed-file ESLint, production build, and `git diff --check` pass.
- Headed Chrome: eight viewport/theme/pointer cases (1440, 390, and 320px; light/dark; desktop/coarse pointers), with no overflow, unchanged link target sizes, and passing link contrast.
- Five retained Atlas pages (`/`, `/milestones`, `/funding`, `/field-velocity`, `/methodology`) each render one footer outside `main`, seven links, and the full exact requested paragraph.
- Corrected the existing footer QA script's outdated `/ecosystem` assumption: that route already redirects to Neurofounders and is not a retained Atlas page.

## Screenshot provenance

These are actual headed-Chrome screenshots of the unchanged prerendered production HTML and assets from application revision `6471f10`, served by a loopback-only static viewer. No source/auth fixture was applied. They verify footer rendering, not hosted authentication or general client navigation. The hosted production URL still requires authentication; nothing is merged or published by this change.

- `footer-desktop-light.png`: 1440px desktop.
- `footer-mobile-light.png`: 390px coarse pointer.
- `footer-mobile-dark.png`: 320px coarse pointer.
