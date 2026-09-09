# Shared performance curves

`/field-velocity` → **Metrics** now shows three compact preview cards. Native disclosure expands each card across the full grid; its larger chart, definitions, methodology, source table and caveats are visible together. No redesign of Milestones, the Funding Index/Companies, or Ecosystem is included.

## Exact scope

| Curve | Canonical object | Observations | Plot semantics |
| --- | --- | ---: | --- |
| Simultaneously recorded neurons | `records[instrument=performance_curves]` | 7 | Historical 1957–2014 frontier; log neurons; source trend is not a current acceleration claim. |
| Neural tissue mapped — selected datasets | `measurementSeries[id=tissue-mapped]` | 7 | Scatter; log mm³; species and volume bases remain distinct. |
| Neural recording hours — selected datasets | `measurementSeries[id=neural-recording-hours]` | 11 | Scatter; linear session-hours; release/modality/access and reused-corpus distinctions retained. |

These are **25 selected observations, not a global inventory or total**. Implanted BCI participants belong to adoption/revealed commitments and are deliberately not added as a performance curve. No annual points, post-2014 neuron maxima, sums, fitted slopes or global growth rates are inferred. TUSZ releases are not summed. POYO remains **more than 100 hours**, not an exact total; its original qualifier is displayed in the table and marker readout.

The remaining Atlas metrics and Expectations still use their older static extracts. They have **not** been silently migrated to the newer provider. The superseded neuron row is removed from that older rendering so the performance curve occurs once. The old archive-wide hours workbench pitch is distinguished from these selected dataset checkpoints.

## Source and provenance

- Canonical candidate provider: `protocol/plrd.org#152`, commit `4b3ac510355212ff4d127badafa994a182aa862f` (unmerged when imported).
- Validated sibling consumer: `protocol/plneuro.xyz#23`, commit `7c8f709091b1475ed19ac4bac98caf869642db01` (unmerged when imported).
- Snapshot: `src/data/field-velocity/neurotech.snapshot.json`. Exact bytes from the real provider `loadFieldVelocity()` → `fieldVelocityForArea(..., "neurotech")` export, not handwritten numbers or a fixture pretending to be an API result.
- Export assembled: `2026-09-09T19:06:18.064Z`. This is **export time**, not observation freshness.
- Export SHA-256: `2b16a8ebf5ada867a79129243fc3f3afada7ad6e75a639ca0d005849607815ee`.
- Adjacent `.provenance.json` records the provider commit, source URLs, schema origin, exact byte count/hash and refresh command.
- `schema.ts` is reused from the pinned PL Neuro consumer, preserving unknown additive fields. Atlas adds validation of the selected neuron frontier before refresh and render.
- `selectPerformance()` retains the original source objects, definitions and methodology. Only this projection is passed to the client; the full feed is parsed in the server page.

There is **no runtime feed fetch**, no scheduled refresh, no writable runtime cache and no claim of current live data. The public disclosure is a neutral collapsed **Export & source provenance**, not a fallback warning. The neuron card is explicitly historical and retains its 2014 observation / 2022 source-check dates; tissue/hours retain all source date bases, precision, notes and checked dates.

## Deliberate refresh

1. Obtain a complete export from the actual provider API (`GET /api/field-velocity/neurotech/`) at a reviewed commit, or execute the provider's real loader and public projection in that checkout. Record `git rev-parse HEAD` from that provider checkout. Do not assume the unmerged API is already deployed on production, and do not replace unavailable data with fabricated responses.
2. Validate and import, passing the exact 40-character provider commit:

   ```sh
   npm run performance:sync -- /path/to/provider-export.json <provider-commit-sha>
   ```

   The refresh rejects invalid schemas, wrong area/version, absent/duplicate measurements, invalid date precision/basis, unsafe source URLs, nonpositive/nonfinite points, misleading plot kinds, unordered neuron years and exports over 1 MiB. Invalid input leaves both last-good snapshot and provenance unchanged. Valid exports retain their exact original bytes. This is an explicit local build-time operation, not a runtime endpoint.
3. Compare against the **independently exported** provider and the reviewed PL Neuro snapshot:

   ```sh
   npm run performance:verify -- /path/to/provider-export.json /path/to/plneuro/neurotech.snapshot.json
   ```

   This checks snapshot bytes against provenance and deep-compares the original performance record, both measurement objects (including every source note/date/qualifier), the shared definition and methodology. It is not a same-file count comparison.
4. Run tests, typecheck, build and browser QA. When the reviewed source really changes, update the immutable selected-object digest in `tests/performance-data.test.mjs` only after confirming the source-to-consumer comparison, then record the new source commit and source changes here. Do not loosen the assertions to accept divergence.

`npm run data:generate` still owns the older Atlas extracts, not this snapshot. Do not edit the generated snapshot independently or wire it to that legacy generator.

## Interaction and accessibility

- Mini previews contain no focusable markers or nested links/buttons. Native `summary` supports Enter/Space; Escape closes an expanded card and restores its summary focus. Opening chooses one full-width graph and leaves the others compact.
- Expanded markers are individually keyboard reachable, including coincident evidence. Hover and focus use the same visible source readout; keyboard focus wins over a stationary pointer, then hover returns on blur.
- Track isolation never changes coordinates or axes. Tissue/hours remain scatter plots, never cross-dataset lines. Every source observation also has exactly one table row.
- Wide full-detail charts/tables scroll within focusable labeled regions at narrow widths; they do not widen the page. Date-precision plotting anchors are explicit.
- Anchors: `#performance_curves`, `#simultaneously-recorded-neurons`, `#tissue-mapped`, `#neural-recording-hours`. Every expanded graph has visible **Direct link** and **Copy link** controls outside its summary. Copied URLs use the actual current origin/path/query, never a hardcoded deployment or localhost.
- Opening a card pushes its graph hash; closing pushes `#performance_curves`. Fresh URLs and Browser Back/Forward restore the chosen graph, select Metrics even after Expectations, and scroll to that graph. `#expectations` tracks the adjacent tab. The shared SubTabs component gains optional controlled state; other plates retain their existing local-state behavior.
- Light/dark styles use existing Atlas tokens. No animation is required, so reduced-motion mode retains all functionality.

## Verification commands

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run lint
```

`typecheck` runs Next's route-type generator before TypeScript so a clean checkout has its `LayoutProps` type. Existing funding tests regenerate `src/data/milestones.json` without a trailing newline; restore that unrelated generated-only change after tests before committing.

Initial implementation verification: 53 tests pass; typecheck/build pass. The untouched baseline has three ESLint errors in `milestone-timeline.tsx` / `theme-toggle.tsx` (React effect/immutability rules). Changed files pass ESLint. The inherited dependency tree also reports two high and one critical npm advisories; no unrelated framework/dependency upgrade is included.

Headed browser QA uses browser-harness only: 1440px, 390px and 320px; all cards open/close full-width, 25 keyboard markers, source rows exactly once, fixed-axis track filtering, mixed hover/focus, deep links, provenance, dark/reduced-motion, and Milestones/Funding/Ecosystem route regressions. The hosted authentication gate is unchanged. Use a loopback-only local QA adapter to exercise a local build; do not disable hosted auth or extract deployment credentials.

Repeatable harness probes live in `scripts/qa/performance-browser.py` and `scripts/qa/performance-share-browser.py`. After acquiring a dedicated browser-harness window/lock, execute each through the harness's Python stdin (not standalone Python or a new browser). `ATLAS_QA_URL` defaults to `http://127.0.0.1:3387/field-velocity`; `ATLAS_QA_OUTPUT` defaults to `.qa`. The share probe tests all three graphs at all three widths: fresh URL expansion/scroll, actual clipboard readback, open/close URL changes, graph-to-graph Back/Forward, and recovery from Expectations. Browser reports/screenshots are local evidence, not committed generated assets.
