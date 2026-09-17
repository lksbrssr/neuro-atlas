# Company logo restoration — 2026-09-17

## Cause and scope

The Ecosystem retirement in PR #42 removed 23 Neurofounders-sourced company images from the shared manifest. Milestones and the Funding index still rendered correctly, but their shared `FirmLogo` received empty logo values and displayed initials. This fix independently sources replacements; it does **not** reinstate the copied directory, its data joins, or its image CDN.

- 23 company assets restored from official company sites (21) or favicon services for verified official domains (2).
- Milestone records with images: **4 → 55 of 66**. This is 51 restored event images, not 51 unique companies.
- Funding index companies with images: **0 → 19 of 25**.
- Entries that did not have an image before the retirement retain the existing initials fallback.
- All non-logo values in both generated datasets are identical after parsed comparison with the base, with only `logo` properties excluded. No financial values, dates, source links, records, UI components, or authentication code changed.
- Assets are bundled locally. Browsing the Atlas does not contact any logo vendor.

Source/provenance, native dimensions, transforms, and hashes: `data/logos/restored-sources.json`. Some source favicons are inherently low resolution (Blackrock 16×14; Neuracle, Gestala, and Enspire 32×32). Normalization to a square canvas does not create new source detail. StairMed's white header artwork is composited onto a dark canvas to remain visible in both themes.

## Verification

- RED: the new regression test failed on all 23 removed company logos before replacement.
- GREEN: all **109 tests passed**, including coverage in both derived consumers, local asset integrity, independent provenance, and the existing initials fallback.
- Typecheck and production build passed.
- Lint: **three pre-existing failures**, reproduced against unchanged base UI source (`milestone-timeline.tsx:147,169`, `theme-toggle.tsx:10`). This data-only change does not modify those files.
- Headed Chrome: Milestones and Funding index at **1440, 390, 320px**, visible images loaded and no document overflow. All **23 served PNGs decoded** successfully; exact results in `browser-results.json`.
- Native pointer hover showed Enspire's image in its tooltip and retained its primary-source link; native company-row click opened Neuralink detail with its logo loaded.
- Dark-theme Milestones checked, including white-on-dark StairMed artwork.

## Evidence boundary

Screenshots are from the actual app routes in a **local development build**, not production. A detached disposable checkout used the documented loopback-only auth fixture. The release branch retains its existing hosted gate unchanged. The hosted production alias is `https://neuro-atlas-app.vercel.app`; this PR is not a production deployment approval.

The QA checkout's data and public assets were synchronized to the candidate; runtime TSX/CSS are unchanged from the base. The regression-test, typecheck, and production-build checks run in the release worktree without that fixture.

## Replay

1. Run `npm ci`, `npm test`, `npm run typecheck`, `npm run build` in the release checkout.
2. Use the documented isolated local auth fixture (`docs/performance-curves.md`). Bind only to `127.0.0.1:3477`.
3. Run `ATLAS_QA_ROOT=<release-checkout> ATLAS_QA_URL=http://127.0.0.1:3477 BU_NAME=<owned-window> browser-harness < scripts/qa/company-logos-browser.py`.
4. Review the captured before/after Milestones, Companies, detail, and dark-theme evidence.
