# Shared site footer

The root layout renders one `SiteFooter` outside the main content landmark on every Atlas route. It uses the Atlas theme and does not alter data, authentication, tracking, or page interactions.

## Copy and link sources

Checked September 10, 2026 against the live HTML:

- [PL R&D homepage](https://www.plrd.org/): PL social handle and Privacy Policy destination.
- [PL R&D blog disclaimer](https://www.plrd.org/blog/better-economies-governance-systems/): informational-only; no offer, solicitation, or recommendation; no guarantee of future performance or outcomes.
- [Protocol Labs policies](https://www.protocol.ai/legal/): verified `#privacy-policy` and `#terms-conditions` anchors. Links reuse the published policies rather than inventing Atlas-specific terms.

The Atlas version explicitly says “not investment advice,” adds that company/project inclusion does not imply endorsement, and cautions about incomplete or changing information. This is adapted website copy, not a representation of legal approval or compliance review.

No CC-BY or blanket ownership claim is copied from PL R&D: third-party data rights are not established by this footer. No nonfunctional cookie-settings button or new tracker is added.

## Verification

- `npm ci`; `npm test` (83 passing); `npm run typecheck`; production `npm run build`.
- Changed-file ESLint passes. Full-project lint still reports the three pre-existing errors in `milestone-timeline.tsx` and `theme-toggle.tsx`. The unchanged dependency lock retains two high and one critical audit advisory; framework upgrades are outside this change.
- `scripts/qa/footer-browser.py`, executed through the headed browser harness against a local production build, checks one footer outside `main` on all six content routes, seven destinations, no document overflow, compact 28px desktop link rows, preserved 44px minimum targets for coarse/touch pointers (including wide touch screens), and text contrast >= 4.5:1 at 1440px, 390px, and 320px in light/dark mode. The column gap is 24px above the small breakpoint and 16px below it.
- Light-theme small text was darkened after a 4.39:1 contrast failure. Final browser-composited text passes in both themes.
- The initial independent review caught the contrast issue. For the compact-spacing follow-up, the browser regression failed on baseline (40px columns / 44px desktop rows), then passed application revision `6451801` (24px columns / 28px desktop rows). Fresh-skeptical visual/code review passed: only spacing changes, no clipped or overlapping links, unchanged copy and focus styles. The mobile check also preserves wrapped legal links and touch targets.

### Screenshot provenance

Screenshots in `footer/` show `/milestones` served from an isolated local production build of application revision `6451801`. Its only application difference is the established uncommitted local-only auth fixture, bound to loopback. The actual PR leaves hosted Basic Auth unchanged. These are local browser screenshots, not proof of authenticated hosted access. Final QA waits for the existing 150ms link-color transition before measuring contrast.

Replay (against an isolated local fixture, never a production auth change):

```sh
BU_NAME=<owned-thread> ATLAS_QA_URL=http://127.0.0.1:3417 \
  ATLAS_QA_OUT=.qa/footer browser-harness < scripts/qa/footer-browser.py
```
