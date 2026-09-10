import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
test('parity verifier rejects changed Idea vintage or Latency original objects', () => {
  const dir = mkdtempSync(join(tmpdir(), 'atlas-pace-parity-'));
  try {
    for (const instrument of ['idea_vintage', 'latency_compression']) {
      const feed = JSON.parse(readFileSync('src/data/field-velocity/neurotech.snapshot.json', 'utf8'));
      feed.records.find(r => r.instrument === instrument).value = 'Changed source claim';
      const input = join(dir, instrument + '.json'); writeFileSync(input, JSON.stringify(feed));
      const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/verify-performance-parity.ts', input], { encoding: 'utf8' });
      assert.notEqual(result.status, 0, 'Parity must compare ' + instrument);
      assert.match(result.stderr, /parity failed/i);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
