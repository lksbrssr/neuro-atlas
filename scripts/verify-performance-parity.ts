import { readFileSync } from "node:fs";
import { deepStrictEqual } from "node:assert";
import { createHash } from "node:crypto";
import { parseFeed } from "../src/lib/field-velocity/schema";
import { selectPerformance, selectPace } from "../src/lib/field-velocity/performance";

const snapshotPath = "src/data/field-velocity/neurotech.snapshot.json";
const bytes = readFileSync(snapshotPath);
const provenance = JSON.parse(readFileSync(snapshotPath + ".provenance.json", "utf8"));
deepStrictEqual(createHash("sha256").update(bytes).digest("hex"), provenance.sha256);
deepStrictEqual(bytes.length, provenance.bytes);
const feed = parseFeed(JSON.parse(bytes.toString("utf8")));
const selected = selectPerformance(feed);
const pace = selectPace(feed);
if (!process.argv[2]) throw new Error("Usage: npm run performance:verify -- <provider-or-PL-Neuro-export.json> [...]");
for (const path of process.argv.slice(2)) {
  const sourceFeed = parseFeed(JSON.parse(readFileSync(path, "utf8")));
  const source = selectPerformance(sourceFeed);
  deepStrictEqual(pace, selectPace(sourceFeed), `Original pace source-object parity failed: ${path}`);
  deepStrictEqual(selected, source, `Original source-object parity failed: ${path}`);
  console.log(`PASS: exact performance + Idea vintage + Latency records, measurements, definitions and methodology match ${path}`);
}
console.log(`Pace scope: ${pace.records.map(r => `${r.instrument}: ${r.state}; ${r.series?.length ?? 0} source points`).join("; ")}`);
console.log(`Snapshot SHA-256 verified: ${provenance.sha256}`);
console.log(`Scope: ${selected.record.series?.length ?? 0} neuron points; ${selected.measurements.map(s => `${s.id}: ${s.tracks.flatMap(t => t.points).length}`).join("; ")}`);
