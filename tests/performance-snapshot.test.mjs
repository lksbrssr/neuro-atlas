import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const providerSha = "4b3ac510355212ff4d127badafa994a182aa862f";
const snapshot = "src/data/field-velocity/neurotech.snapshot.json";

test("snapshot refresh validates the actual export and preserves exact bytes with commit provenance", async () => {
  assert.ok(existsSync("scripts/sync-performance-curves.ts"), "Missing validated snapshot refresh");
  const { syncSnapshot } = await import("../scripts/sync-performance-curves.ts");
  const dir = mkdtempSync(join(tmpdir(), "atlas-curves-"));
  try {
    const input = existsSync(snapshot) ? snapshot : "data/field-velocity/provider-export.json";
    const output = join(dir, "snapshot.json");
    const provenance = syncSnapshot(input, providerSha, output);
    const bytes = readFileSync(input);
    assert.deepEqual(readFileSync(output), bytes);
    assert.equal(provenance.sha256, createHash("sha256").update(bytes).digest("hex"));
    assert.equal(provenance.providerCommit, providerSha);
    assert.equal(provenance.exportGeneratedAt, JSON.parse(bytes).generatedAt);
    const previous = readFileSync(output);
    const previousProvenance = readFileSync(output + ".provenance.json");
    const bad = JSON.parse(bytes);
    bad.records.find(r => r.instrument === "performance_curves").series = [];
    const invalid = join(dir, "invalid.json");
    writeFileSync(invalid, JSON.stringify(bad));
    assert.throws(() => syncSnapshot(invalid, providerSha, output), /neuron/i);
    assert.deepEqual(readFileSync(output), previous);
    assert.deepEqual(readFileSync(output + ".provenance.json"), previousProvenance);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
