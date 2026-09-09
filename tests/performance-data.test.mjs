import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const feed = JSON.parse(readFileSync("src/data/field-velocity/neurotech.snapshot.json", "utf8"));

test("performance selection preserves original source objects and excludes adoption", async () => {
  assert.ok(existsSync("src/lib/field-velocity/performance.ts"), "Missing canonical performance selection");
  const { selectPerformance } = await import("../src/lib/field-velocity/performance.ts");
  const selected = selectPerformance(feed);
  assert.deepEqual(selected.record, feed.records.find(r => r.instrument === "performance_curves"));
  assert.deepEqual(selected.measurements, feed.measurementSeries.filter(s => s.instrument === "performance_curves"));
  assert.deepEqual(selected.measurements.map(s => s.id), ["tissue-mapped", "neural-recording-hours"]);
  assert.equal(selected.record.series.length, 7);
  assert.equal(createHash("sha256").update(JSON.stringify({ record: selected.record, measurements: selected.measurements })).digest("hex"), "3df7420101ca1f98a5218a3b460edd4ed02266d3321e3d0b2ea5309520e39579", "Exact immutable PL Neuro / PLRD selected-object digest (not a consumer-only count)");
  assert.deepEqual(selected.measurements.map(s => s.tracks.flatMap(t => t.points).length), [7, 11]);
});
