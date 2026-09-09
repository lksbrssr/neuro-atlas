import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncSnapshot, MAX_EXPORT_BYTES } from "../scripts/sync-performance-curves.ts";
import { parseFeed } from "../src/lib/field-velocity/schema.ts";
import { selectPerformance } from "../src/lib/field-velocity/performance.ts";
import { chartGeometry, pointDate, pointValue, PerformanceCurves } from "../src/components/performance-curves.tsx";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const bytes = readFileSync("src/data/field-velocity/neurotech.snapshot.json");
const feed = JSON.parse(bytes);
const provenance = JSON.parse(readFileSync("src/data/field-velocity/neurotech.snapshot.json.provenance.json", "utf8"));
const point = f => f.measurementSeries[0].tracks[0].points[0];
const invalid = {
  "wrong area": f => { f.area.key = "ai"; },
  "wrong schema version": f => { f.schemaVersion = 2; },
  "missing measurements": f => { delete f.measurementSeries; },
  "duplicate series": f => { f.measurementSeries[1] = f.measurementSeries[0]; },
  "duplicate tracks": f => { f.measurementSeries[0].tracks.push(f.measurementSeries[0].tracks[0]); },
  "zero value": f => { point(f).value = 0; },
  "negative value": f => { point(f).value = -1; },
  "impossible date": f => { point(f).date = "2023-02-30"; },
  "precision mismatch": f => { point(f).date = "2011-02-01"; },
  "unsafe source": f => { point(f).sourceUrl = "javascript:alert(1)"; },
  "blank provenance": f => { point(f).note = " "; },
  "missing precision": f => { delete point(f).datePrecision; },
  "invalid qualifier": f => { point(f).qualifier = "exact-ish"; },
  "wrong units": f => { f.measurementSeries[0].unit = "hours"; },
  "pooled line": f => { f.measurementSeries[2].chartKind = "line"; },
  "nonlog tissue": f => { f.measurementSeries[0].scale = "linear"; },
  "duplicate date": f => { f.measurementSeries[0].tracks[0].points.push(point(f)); },
  "missing neuron points": f => { f.records[0].series = []; },
  "unordered neuron years": f => { f.records[0].series[1].x = 1950; },
  "nonpositive neuron value": f => { f.records[0].series[0].y = 0; },
};
for (const [name, mutate] of Object.entries(invalid)) test(`refresh rejects ${name} without replacing snapshot or provenance`, () => {
  const dir = mkdtempSync(join(tmpdir(), "atlas-invalid-"));
  try {
    const input = join(dir, "input.json"), output = join(dir, "snapshot.json");
    writeFileSync(input, bytes);
    syncSnapshot(input, provenance.providerCommit, output);
    const oldMeta = readFileSync(output + ".provenance.json");
    const bad = structuredClone(feed); mutate(bad);
    writeFileSync(input, JSON.stringify(bad));
    assert.throws(() => syncSnapshot(input, provenance.providerCommit, output), name);
    assert.deepEqual(readFileSync(output), bytes);
    assert.deepEqual(readFileSync(output + ".provenance.json"), oldMeta);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("bounded export, malformed SHA, malformed JSON, and nonfinite values fail closed", () => {
  const dir = mkdtempSync(join(tmpdir(), "atlas-bounds-"));
  try {
    const input = join(dir, "input.json");
    writeFileSync(input, Buffer.alloc(MAX_EXPORT_BYTES + 1, 32));
    assert.throws(() => syncSnapshot(input, provenance.providerCommit, join(dir, "out.json")), /1 MiB/);
    assert.throws(() => syncSnapshot(input, "SHA" + provenance.providerCommit, join(dir, "out.json")), /40-character/);
    writeFileSync(input, "{");
    assert.throws(() => syncSnapshot(input, provenance.providerCommit, join(dir, "out.json")));
    const bad = structuredClone(feed); point(bad).value = Infinity;
    assert.throws(() => parseFeed(bad));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("geometry retains finite coordinates, elapsed-time spacing and sub-one log ticks", () => {
  for (const s of selectPerformance(parseFeed(feed)).measurements) {
    const data = { ...s, points: s.tracks.flatMap(t => t.points), line: false };
    const g = chartGeometry(data);
    for (const p of data.points) {
      assert.ok(Number.isFinite(g.x(p.date)) && Number.isFinite(g.y(p.value)));
      assert.ok(g.x(p.date) >= g.left && g.x(p.date) <= g.width - g.right);
      assert.ok(g.y(p.value) >= 0 && g.y(p.value) <= g.height);
    }
    if (s.id === "tissue-mapped") assert.ok(g.ticks.some(t => t > 0 && t < 1));
    const midpoint = new Date((g.minTime + g.maxTime) / 2).toISOString();
    assert.ok(Math.abs(g.x(midpoint) - (g.left + g.width - g.right) / 2) < 1e-6);
  }
});

test("formatting retains all precision and qualifier semantics", () => {
  const p = point(feed);
  assert.equal(pointDate(p), "2011");
  assert.equal(pointDate({ ...p, date: "2011-02-01", datePrecision: "month" }), "2011-02");
  assert.equal(pointDate({ ...p, date: "2011-02-03", datePrecision: "day" }), "2011-02-03");
  assert.equal(pointValue({ ...p, value: 100, qualifier: "greater-than" }), "More than 100");
  assert.equal(pointValue({ ...p, value: 100, qualifier: "at-least" }), "At least 100");
  assert.equal(pointValue({ ...p, value: 100, qualifier: "approximate" }), "Approximately 100");
});

for (const state of ["unwired", "not_applicable"]) test(`${state} overrides retained neuron values, charts, and observation dates`, () => {
  const changed = structuredClone(feed);
  Object.assign(changed.records[0], { state, candidateMetric: "Future frontier", blocker: "No comparable reading", reason: "Not applicable" });
  const html = renderToStaticMarkup(React.createElement(PerformanceCurves, { data: selectPerformance(parseFeed(changed)), provenance }));
  assert.doesNotMatch(html, /data-frontier-line|data-source-observation="neuron|2014-01-01|Up to ~3,200/);
  assert.equal((html.match(/data-source-observation=/g) ?? []).length, 18);
});
