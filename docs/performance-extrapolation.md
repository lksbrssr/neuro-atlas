# Opt-in Performance extrapolation

## Scope and defaults

This change is the extrapolation-only branch, based on `58dd8c2`. Draft-chart tabs/navigation are a separate change. No canonical feed, definitions, provenance, source tables, navigation, modal/history behavior, other chart types or preview-card geometry are changed.

The expanded **Simultaneously recorded neurons** and **Neural recording hours** modals each have an accessible, native-button `role="switch"` control named Extrapolation. It starts **off** whenever that modal mounts; it is intentionally not persisted to storage or encoded in the share URL. Off executes the original geometry path and removes targets, model output and scenario notes. Preview cards have no switch and remain unchanged. Tissue mapped has no extrapolation: it lacks comparable within-track history.

On adds horizontal reference targets, a visibly dashed conditional continuation, rounded crossing years and always-visible plain-English limitations. Models and target configuration live in `src/lib/extrapolation.ts`, separate from observations. Model samples never receive `data-curve-point` or `data-source-observation`; source tables/counts still refer only to observations.

## Method

For one comparable track, use ordinary least squares of `ln(value)` against decimal UTC year:

- `slope = Σ((year - meanYear) × (ln(value) - meanLogValue)) / Σ((year - meanYear)²)`
- `doublingYears = ln(2) / slope`
- `value(year) = lastActualValue × exp(slope × (year - lastActualYear))`
- `crossingYear = lastActualYear + (ln(target) - ln(lastActualValue)) / slope`

The regression **slope** is used, not its fitted intercept: the first dashed sample is exactly the last actual point. Decimal-year fractions use elapsed UTC days within that calendar year, including leap years; dates are validated ISO calendar dates, not silently normalized impossible dates.

Require at least three distinct dates, positive finite values, a single track and positive finite growth. Empty, invalid, flat and decreasing histories return no fit. Conflicting values on the latest date are rejected because there is no unique anchor. Flat values have an explicit guard against floating-point noise creating a spurious tiny positive slope. No date is displayed for invalid targets or unavailable fits. Targets already at/below the latest source value are labeled as such rather than assigned a future date.

The continuation ends at the largest target crossing, or at 2200 when a target lies beyond the display horizon. Display domains round up to a decade but never exceed 2200. Beyond-range targets get a range label, not a fabricated date. Sixty-five rendering samples are model coordinates, not observations or evidence of confidence. There is no confidence interval or current-global-forecast claim.

## Neurons: historical continuation, not a current forecast

All seven selected historical electrical recording observations are used:

| Year | Simultaneously recorded neurons |
| --- | ---: |
| 1957 | 2 |
| 1970 | 8 |
| 1981 | 18 |
| 1991 | 82 |
| 1993 | 148 |
| 2009 | 744 |
| 2014 | 3,200 |

Independent Python `statistics.linear_regression` fixtures, using natural logs:

- Slope: `0.12556154562543675` per year.
- Doubling time: `5.520377892031338` years.
- Mouse reference, approximately 70,000,000 neurons: crossing `2093.5872626563255`, displayed **≈2094**.
- Human reference, approximately 86,000,000,000 neurons: crossing `2150.241609317579`, displayed **≈2150**.

This is a fit to these **seven selected points**, not the source summary's seven-year literature estimate. It ends in 2014 and is not evidence about the current frontier. Mixed-species historical electrical recordings are not a human-specific trajectory. Neuron-count equivalence does not demonstrate successful spatial/temporal whole-brain live simultaneous recording or its feasibility.

Reference assumptions supplied in the implementation brief (parent research/source verification remains outstanding):

- Mouse: Herculano-Houzel et al. (2006), https://doi.org/10.1073/pnas.0604911103.
- Human: Azevedo et al. (2009), https://doi.org/10.1002/cne.21974.

These references support approximate whole-brain neuron counts, not an achieved recording capability. Target counts must remain separate from the historical source series.

## Hours: TUSZ corpus-only scenario

Never fit all eleven pooled dataset observations, sum releases, or project the POYO primate training corpus. Only `tusz-scalp-eeg` has a comparable time series in this snapshot: **eight full release totals, 2017–2020**, retaining the 651 h and 1,074 h plateaus. These are overlapping release snapshots, not additive annual production. The fit includes held-out evaluation data because the source reports full corpus totals.

Independent fixtures:

- Slope: `0.4977159633696027` per year.
- Last actual anchor: `2020-05-09`, decimal year `2020.3524590163934`, **1,074 hours**.
- Doubling time: `1.3926561162861795` years.
- 100,000 h milestone: `2029.4616307600666`, displayed **TUSZ corpus-only · ≈2029**.
- 100,000,000 h article goal: `2043.3405411976898`, displayed **TUSZ corpus-only · ≈2043**.

Every displayed hours crossing carries TUSZ corpus-only scope, including SVG labels. Worldwide human-data ETA is explicitly unavailable. These dates are consequences of continuing a short, old corpus-release history, not predictions of worldwide data supply, unique subject-hours, access or usable training data.

The requested 100,000-hour milestone is distinct from the **100 million hours** goal in the article: https://www.plrd.org/blog/neurotech-frontier-human-flourishing/ (article interpretation supplied in brief; parent owns corroboration).

Selecting AJILE12, POYO or JapanEEG removes the TUSZ line and dates and explains insufficient comparable history; target reference lines remain. Returning to All tracks or TUSZ restores the same fit. The enabled-view axes use the full source set and all-track scenario extent so filtering never moves an observation. All eleven source-table rows remain visible regardless of filter.

## Rendering and accessibility

- Off keeps the original linear hours scale and exact original domains; neurons remain log-scaled.
- On uses log axes to accommodate large target values; the hours control explicitly announces the linear-to-log change.
- Enabled charts use a 720 × 380 viewBox, a 720px minimum rendered width and internal horizontal scrolling on small screens. Off retains the prior 560px SVG minimum.
- Compact suffixes prevent billion-scale tick overflow. Two-row target/crossing labels reserve vertical clearance; the future x-axis includes intermediate decades (20-year intervals on the long neuron horizon).
- Native switch buttons retain keyboard activation/focus behavior and 44px minimum touch targets. Observation markers retain focusable source readouts; the dashed model is noninteractive and not counted as source data.
- No local server, browser QA, auth changes, push, PR, deployment or external critic were run in this implementation lane. Parent owns headed desktop/mobile inspection, source corroboration and review.

## Verification

Tests live in the standard `tests/*.test.mjs` glob:

- `tests/extrapolation.test.mjs`: anchored numerical fixtures, strict dates/values, mixed-track rejection, flat/decreasing/insufficient history, conflicting anchors, TUSZ-only selection with retained plateaus, target metadata separation and bounded crossings/samples.
- `tests/extrapolation-ui.test.mjs`: modal-only/default-off/on/off interactions; exact baseline SVG hashes captured from untouched `58dd8c2`; unchanged source-table bytes/counts and preview DOM; source snapshot/provenance hashes; fixed coordinates during filtering; scoped hours dates and unsupported-track suppression; focusable readouts; unchanged tissue chart; flat/decreasing/beyond-range display; computed CSS minimum widths and label rows.
- Existing modal, URL/history, pace, data parity/validation and Metrics-grid tests remain in the full suite.

Commands:

```sh
npm test
npm run typecheck
npx eslint src/components/performance-curves.tsx src/lib/extrapolation.ts tests/extrapolation.test.mjs tests/extrapolation-ui.test.mjs
git diff --check
```

Tests were implemented in incremental RED/GREEN slices before production changes: missing numerical model; invalid-series rejection; bounded crossings; TUSZ-only selection; neuron targets/horizon; neuron modal toggle; hours toggle/suppression; responsive layout; flat-value floating-point guard. Additional unchanged-source/baseline guards and UI failure-state regressions cover preservation requirements. JSDOM computed CSS is not evidence of actual browser pixels or document overflow; parent browser QA remains necessary.
