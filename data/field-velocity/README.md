# Field velocity — Neurotech

Extracted from **protocol/plrd.org** (`main` @ `06cb5d2`), the source behind the impact preview at plrd.org/impact-preview-eb61fba1b98e/ (Neurotech field-velocity tab). Source modules: `src/lib/velocity-instruments.ts`, `src/lib/inflection-points.ts`, `src/lib/market-signals.ts`.

## Files

- **`instruments.json`** — the five velocity instruments (performance curves, latency compression, idea vintage, revealed commitments, markets) + inflection-point explainer. Field-agnostic definitions.
- **`neurotech_records.json`** — the neurotech readings: Stevenson neuron-count curve (1957–2014, log scale, doubling ~7y), cumulative iBCI implants (67, 1998–2024, vs the 10,000-by-2030 milestone), and three honestly-`unwired` instruments with named blockers.
- **`neurotech_inflection_points.json`** — four dated, falsifiable shifts (BCI app store, neural distillation, neuromorphic energy pivot, memory retrieval in simulation).
- **`neurotech_market_signals.json`** — live forecast-market mappings per inflection point (Kalshi Neuralink implant count, Metaculus #372/#2813, one named white-space gap) + API endpoints for live pulls.

## Design principles inherited from the source

1. **Never fabricate a reading.** An instrument is `reading`, `unwired` (candidate metric + blocker), or `not_applicable` (reason). Ragged is honest.
2. **`measuredAt` vs `checkedAt`** — observation date vs pipeline-run date; stale readings get flagged and lose their direction chip.
3. **Series carry provenance** — every reading has sources; series can mark trailing points `reliable: false` (rendered dashed, excluded from direction).

## Interaction contract (ported to `src/components/sparkline.tsx`)

The sparkline component supports: hover crosshair with value/x tooltip, **click-hold-drag to measure the delta between two points** (absolute + relative + time range readout; click clears), log axes, confidence bands, dashed unreliable tails, optional secondary normalizer line, labelled min/max axis. This is the interaction standard for all time-series in this dashboard.
