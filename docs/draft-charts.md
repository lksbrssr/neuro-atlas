# Draft charts gallery

`/field-velocity#draft-charts` is the third Field velocity view, alongside Metrics and Expectations. It is a definition-only gallery, not a collection of populated plots or a forecast.

## Scope

All 19 candidate definitions appear exactly once across six measurement families:

| Family | Definitions |
| --- | ---: |
| Mapping scale | 3 |
| Cost and automation | 3 |
| Tissue quality and annotation | 3 |
| Human interfaces and recordings | 2 |
| Data access and scientific use | 4 |
| Simulation, NeuroAI, and impact | 4 |

`src/data/draft-charts.ts` owns the definitions. Each card states proposed axes, its measurement definition, a comparability condition, and **No observations assembled**. There are no new coordinates, fabricated observations, extrapolations, source claims, or implied global totals. Internal deliberations and attribution are not included.

Two cards link to the existing bounded Metrics charts: tissue mapped (currently mm³, rather than the proposed cm³) and selected neural-recording hours. Existing observations are neither duplicated nor summed. The largest-published-connectome candidate is separate: anatomical neuron/synapse map frontiers are not mapped tissue volume or living-neuron recording. Reconstruction accuracy uses evaluation year while holding the reference dataset, benchmark, and metric version fixed.

## Navigation

The stable `#draft-charts` fragment selects the gallery on a fresh URL and through Back/Forward. Existing five chart fragments, Metrics, and Expectations remain valid. Both draft-to-Metrics links preserve ordinary modifier-click behavior; a normal click opens the corresponding Metrics modal. Close/Escape returns to the Draft view and originating link, including React StrictMode replay. The narrow tab rail scrolls locally and keeps its selection visible when the viewport changes.

## Verification — September 11, 2026

Runtime revision: `c418d5f062b59b5d16738e463793d409b8eb719e`. Later documentation/screenshots do not change application source.

- Frozen native `npm ci`; `npm test`: **122 passed, 0 failed**.
- `npm run typecheck`, changed-file ESLint, and production `npm run build`: pass.
- Full-repository ESLint still reports the same three pre-existing errors in `milestone-timeline.tsx` and `theme-toggle.tsx`; those files are unchanged.
- Independent bounded review: PASS at the runtime revision. It independently reran 23 focused tests and closed the StrictMode focus, temporal-axis, and selected-tab resize findings.
- Headed Chrome at **1440, 390, and 320 px**: all 19 definition cards, six categories, both Metrics links, keyboard activation, fresh Draft links, history, Escape/Close/focus return, text bounds, and zero document overflow pass.
- All **five existing chart modals × three widths**: original source counts, direct/fresh links, real clipboard readback, focus wrap/return, Escape/Close/backdrop, and unchanged geometry/scroll across Back/Forward pass. Track filtering, mixed pointer/keyboard readouts, dark/reduced motion, and existing routes pass.
- Resize without navigation: the selected Draft tab stays wholly within its local rail at all three widths.
- Existing extrapolation implementation, measurement snapshot bytes, and hosted authentication are unchanged relative to main.

Reproducible probes:

```sh
npm test
npm run typecheck
npm run build
# Run these through browser-harness stdin in an owned browser window:
# ATLAS_QA_URL=http://127.0.0.1:<port>/field-velocity
# ATLAS_QA_OUTPUT=<local evidence directory>
# scripts/qa/draft-charts-browser.py
# scripts/qa/modal-browser.py
```

Machine-readable results are under `docs/qa/draft-charts/`. Screenshots in `docs/screenshots/draft-charts-*.png` are actual headed-Chrome captures of this runtime, not mockups.

**Evidence boundary:** UI checks and screenshots used a disposable, loopback-only production build with an explicit test-only authentication fixture. The application checkout and hosted Basic Auth gate were not modified. Local UI evidence does not claim an authenticated hosted session was tested. This PR does not merge or enable a production launch.
