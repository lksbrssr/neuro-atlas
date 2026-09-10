import type { FieldVelocityFeed } from "./schema";

/** Preserve the original objects: this is a projection, never a second dataset. */
export function selectPerformance(feed: FieldVelocityFeed) {
  const record = feed.records.find(r => r.instrument === "performance_curves")!;
  if (record.state === "reading") {
    if (!record.series?.length || record.seriesScale !== "log") throw new Error("Missing neuron frontier series or log scale");
    for (const [index, point] of record.series.entries()) {
      if (typeof point.x !== "number" || !Number.isInteger(point.x) || point.x < 1000 || point.x > 9999 || !Number.isFinite(point.y) || point.y <= 0 || (index > 0 && Number(record.series[index - 1].x) >= point.x)) {
        throw new Error("Invalid neuron frontier observation");
      }
    }
  }
  return {
    record,
    definition: feed.instruments.find(i => i.id === "performance_curves")!,
    measurements: feed.measurementSeries.filter(s => s.instrument === "performance_curves"),
    methodology: feed.methodology,
  };
}
export type PerformanceData = ReturnType<typeof selectPerformance>;

export const paceIds = ["idea_vintage", "latency_compression"] as const;
export function selectPace(feed: FieldVelocityFeed) {
  const records = paceIds.map(id => feed.records.find(r => r.instrument === id)!);
  for (const record of records) {
    if (record.state !== "reading") continue;
    if (!record.series?.length || record.seriesScale !== "linear") throw new Error("Missing pace series or linear scale");
    for (const [index, point] of record.series.entries()) {
      if (typeof point.x !== "number" || !Number.isInteger(point.x) || point.x < 1000 || point.x > 9999 || !Number.isFinite(point.y) || point.y < 0 || (index > 0 && Number(record.series[index - 1].x) >= point.x)) throw new Error("Invalid pace year or value");
    }
  }
  return {
    records,
    definitions: paceIds.map(id => feed.instruments.find(d => d.id === id)!),
    methodology: feed.methodology,
  };
}
export type PaceData = ReturnType<typeof selectPace>;
