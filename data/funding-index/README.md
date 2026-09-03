# BCI Funding Index data

This directory powers the `/funding` plate. It is a deliberately bounded, source-linked index of public financing events for a screened set of implanted and implant-adjacent BCI companies. It is **not** a comprehensive market census and it does not represent total funding to date.

## Scope

A company is included when it fits at least one of these categories:

- implanted BCI or implanted neural interface;
- minimally invasive interface, including endovascular systems;
- implant-adjacent platform with a direct BCI or neuromodulation thesis.

The v1 list was seeded from the project's BCI company tracker, then screened and source-checked. The larger 363-company Neurofounders ecosystem remains the source for the ecosystem plate and is not filtered or replaced by this index.

## Financing rules

- Publicly disclosed rounds of at least USD 2 million, or a clearly qualifying local-currency equivalent, are eligible.
- Amounts are round sizes, not company valuations and not all-time company funding.
- `amount_usd_m` is used for visual comparison. When a release disclosed another currency, `display_amount` and `note` preserve that original amount and identify the USD figure as approximate.
- Strategic investments, grants, and government-backed financings are retained when they are material and sourceable; `stage` names the financing form rather than forcing it into a venture round taxonomy.
- A company can have older or smaller financings that are not shown. Missing rounds should not be read as zero funding.

## Investor view

Investor participation is counted once per indexed financing event. Associated capital is the full size of rounds in which an investor appears; it is **not** an estimate of that investor's check size or ownership. Investor names are normalized only for obvious spelling consistency.

## Regulatory markers

`milestones.csv` contains selected public inflection points that help explain capital timing:

- BDD — FDA Breakthrough Device Designation
- IDE — FDA Investigational Device Exemption
- CE — European CE marking
- NMPA — China National Medical Products Administration milestone
- TAP — FDA Total Product Life Cycle Advisory Program
- Pivotal — pivotal-study start or authorization

The set is illustrative and source-linked, not a complete regulatory history.

## Files

- `companies.csv` — the screened company universe and classification fields
- `rounds.csv` — disclosed financing events, investor participants, and sources
- `milestones.csv` — selected regulatory inflection points and sources
- `src/data/funding-index.json` — generated client payload; do not edit by hand

## Updating

1. Add or amend source rows in this directory.
2. Run `npm run data:generate`.
3. Run `npm test`, `npm run lint`, and `npm run build`.
4. Check `/funding` in both themes and at desktop and mobile widths.
5. Update `metadata.asOf` in `scripts/generate-derived.mjs` only when the source review actually advanced.

## Coverage date

Source review current through **2026-09-03**. Every shipped financing and regulatory marker carries a direct source URL.
