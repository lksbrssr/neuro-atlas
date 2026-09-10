import { z } from "zod";

const text = z.string().min(1).max(30000);
const date = text.refine(
  (v) =>
    /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(v) && Number.isFinite(Date.parse(v)),
  "Expected ISO date",
);
const url = text.refine((v) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}, "Expected safe HTTPS URL");
const href = z.union([
  url,
  text.refine(
    (v) => v.startsWith("/") && !v.startsWith("//") && !v.includes("\\"),
    "Expected root-relative URL",
  ),
]);
export const instrumentIds = [
  "performance_curves",
  "latency_compression",
  "idea_vintage",
  "revealed_commitments",
  "markets",
] as const;
const id = z.enum(instrumentIds);
const state = z.enum(["reading", "unwired", "not_applicable"]);
const direction = z.enum(["accelerating", "flat", "decelerating", "unclear"]);
const source = z.object({ label: text, url }).passthrough();
const point = z
  .object({
    x: z.union([text, z.number().finite()]),
    y: z.number().finite(),
    lo: z.number().finite().optional(),
    hi: z.number().finite().optional(),
    reliable: z.boolean().optional(),
  })
  .passthrough();
const series = z.array(point).max(5000);
const patent = z
  .object({
    state,
    value: text.optional(),
    series: series.optional(),
    direction: direction.optional(),
    measuredAt: date.optional(),
    sources: z.array(source).optional(),
    candidateMetric: text.optional(),
    blocker: text.optional(),
    reason: text.optional(),
  })
  .passthrough();
const record = z
  .object({
    instrument: id,
    state,
    metric: text.optional(),
    value: text.optional(),
    trend: text.optional(),
    direction: direction.optional(),
    window: text.optional(),
    measuredAt: date.optional(),
    checkedAt: date.optional(),
    series: series.optional(),
    seriesScale: z.enum(["linear", "log"]).optional(),
    series2: series.optional(),
    series2Label: text.optional(),
    provenance: z
      .object({ query: text.optional(), generated: text.optional() })
      .passthrough()
      .optional(),
    sources: z.array(source).optional(),
    candidateMetric: text.optional(),
    blocker: text.optional(),
    owner: text.optional(),
    reason: text.optional(),
    patentVintage: patent.optional(),
  })
  .passthrough();
const role = z.enum([
  "infrastructure",
  "legibility",
  "connection",
  "capital",
  "translation",
  "permission",
]);
const hypothesis = z
  .object({
    area: z.literal("neurotech"),
    opportunitySpace: text,
    title: text,
    signal: text,
    cascade: text,
    contribution: z
      .object({ inputs: text, activities: text, outputs: text })
      .passthrough(),
    roles: z.array(role),
    interventions: z
      .array(
        z.object({ role, label: text, href: href.optional() }).passthrough(),
      )
      .optional(),
    liveEvidence: z
      .array(z.object({ label: text, href, note: text }).passthrough())
      .optional(),
    outcome: z.enum(["pending", "reached", "missed", "retired"]).optional(),
    mattered: z.enum(["unknown", "too_early", "yes", "no"]).optional(),
    matteredEvidence: text.optional(),
    fieldMovedAnyway: z.boolean().optional(),
    retiredReason: text.optional(),
    predictedBy: date.nullable().optional(),
    falsifiesIf: text.nullable().optional(),
    asOf: date.optional(),
  })
  .passthrough();
const market = z
  .object({
    match: z.enum(["direct", "proxy", "gap"]),
    platform: z
      .enum(["polymarket", "kalshi", "metaculus", "futarchy"])
      .nullable(),
    prob: z.number().min(0).max(1).nullable(),
    volume: z.number().nonnegative().nullable(),
    question: text.nullable(),
    url: url.nullable(),
    resolutionDate: date.nullable().optional(),
    readout: text.optional(),
    viaFallback: z.boolean(),
    note: text,
  })
  .passthrough();
const tool = z
  .object({
    id: z.enum([
      "legibility",
      "connection",
      "funding",
      "policy",
      "infrastructure",
      "translation",
      "culture",
    ]),
    title: text,
    subtitle: text,
    oneLiner: text,
    description: text,
    proposed: z.boolean().optional(),
    examples: z.array(
      z.object({ label: text, href, blurb: text.optional() }).passthrough(),
    ),
  })
  .passthrough();
const measurementText = text.refine(
  (value) => value.trim().length > 0,
  "Expected nonblank text",
);
const measurementDate = measurementText.refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}, "Expected real calendar date YYYY-MM-DD");
const measurementPoint = z
  .object({
    date: measurementDate,
    datePrecision: z.enum(["day", "month", "year"]),
    dateBasis: z.enum(["release", "publication", "observation", "disclosure"]),
    value: z.number().finite().positive(),
    label: measurementText,
    sourceUrl: url,
    sourceLabel: measurementText,
    note: measurementText,
    qualifier: z.enum(["approximate", "at-least", "greater-than"]).optional(),
  })
  .passthrough();
const measurementTrack = z
  .object({
    id: measurementText,
    label: measurementText,
    definition: measurementText,
    points: z.array(measurementPoint).min(1).max(5000),
  })
  .passthrough();
const measurementSeries = z
  .object({
    id: z.enum(["tissue-mapped", "bci-implants", "neural-recording-hours"]),
    title: measurementText,
    instrument: z.enum(["performance_curves", "revealed_commitments"]),
    lens: z.enum(["capability", "adoption", "data-supply"]),
    unit: z.enum(["mm³", "participants", "hours"]),
    description: measurementText,
    coverage: measurementText,
    caveat: measurementText,
    checkedAt: measurementDate,
    chartKind: z.enum(["scatter", "line"]),
    scale: z.enum(["linear", "log"]),
    tracks: z.array(measurementTrack).min(1).max(100),
  })
  .passthrough();
export type MeasurementPoint = z.infer<typeof measurementPoint>;
export type MeasurementTrack = z.infer<typeof measurementTrack>;
export type MeasurementSeries = z.infer<typeof measurementSeries>;

export const feedSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: date,
    area: z.object({ key: z.literal("neurotech"), label: text }).passthrough(),
    source: z
      .object({ url, repository: url, methodologyUrl: url })
      .passthrough(),
    instruments: z
      .array(
        z
          .object({ id, label: text, subtitle: text, description: text })
          .passthrough(),
      )
      .length(5),
    measurementSeries: z.array(measurementSeries).length(3),
    records: z.array(record).length(5),
    inflectionPoints: z.array(hypothesis).length(4),
    marketSignals: z.record(z.string(), market),
    toolkit: z.array(tool).length(7),
    methodology: z
      .object({
        intro: text,
        attribution: text,
        observedVelocity: text,
        stocksAndFlows: text,
      })
      .passthrough(),
  })
  .passthrough();
export type FieldVelocityFeed = z.infer<typeof feedSchema>;
export type InstrumentRecord = z.infer<typeof record>;
export type SeriesPoint = z.infer<typeof point>;
export type MarketSignal = z.infer<typeof market>;
export function parseFeed(value: unknown): FieldVelocityFeed {
  const feed = feedSchema.parse(value);
  if (
    new Set(feed.instruments.map((i) => i.id)).size !== 5 ||
    new Set(feed.toolkit.map((t) => t.id)).size !== 7 ||
    new Set(feed.records.map((r) => r.instrument)).size !== feed.records.length
  )
    throw new Error("Duplicate definitions or records");
  for (const r of feed.records) {
    if (
      r.state === "reading" &&
      (!r.metric || !r.value || !r.measuredAt || !r.sources?.length)
    )
      throw new Error("Unsourced reading");
    if (r.state === "unwired" && (!r.candidateMetric || !r.blocker))
      throw new Error("Missing unwired explanation");
    if (r.state === "not_applicable" && !r.reason)
      throw new Error("Missing applicability reason");
    for (const p of [...(r.series ?? []), ...(r.series2 ?? [])]) {
      if (r.seriesScale === "log" && (p.y <= 0 || (p.lo != null && p.lo <= 0)))
        throw new Error("Invalid log value");
      if ((p.lo != null && p.lo > p.y) || (p.hi != null && p.hi < p.y))
        throw new Error("Invalid confidence interval");
    }
  }
  if (new Set(feed.measurementSeries.map((s) => s.id)).size !== 3)
    throw new Error("Duplicate measurement categories");
  const canonical = {
    "tissue-mapped": {
      instrument: "performance_curves",
      lens: "capability",
      unit: "mm³",
      chartKind: "scatter",
    },
    "bci-implants": {
      instrument: "revealed_commitments",
      lens: "adoption",
      unit: "participants",
      chartKind: "line",
    },
    "neural-recording-hours": {
      instrument: "performance_curves",
      lens: "data-supply",
      unit: "hours",
      chartKind: "scatter",
    },
  } as const;
  for (const s of feed.measurementSeries) {
    const expected = canonical[s.id];
    if (
      s.instrument !== expected.instrument ||
      s.lens !== expected.lens ||
      s.unit !== expected.unit ||
      s.chartKind !== expected.chartKind ||
      (s.id === "tissue-mapped" && s.scale !== "log")
    )
      throw new Error(
        "Measurement category does not match its framework or chart semantics",
      );
    if (new Set(s.tracks.map((t) => t.id)).size !== s.tracks.length)
      throw new Error("Duplicate measurement tracks");
    for (const track of s.tracks) {
      for (const [index, point] of track.points.entries()) {
        if (
          (point.datePrecision === "year" && !point.date.endsWith("-01-01")) ||
          (point.datePrecision === "month" && !point.date.endsWith("-01"))
        )
          throw new Error(
            "Measurement coordinate disagrees with date precision",
          );
        if (index > 0 && track.points[index - 1].date >= point.date)
          throw new Error(
            "Measurement points must be sorted with unique dates within a track",
          );
        if (s.unit === "participants" && !Number.isInteger(point.value))
          throw new Error("Participant counts must be whole people");
      }
    }
  }
  return feed;
}
