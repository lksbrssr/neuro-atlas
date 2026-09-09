import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as pace from '../src/lib/field-velocity/performance.ts';
const feed = JSON.parse(readFileSync('src/data/field-velocity/neurotech.snapshot.json', 'utf8'));
test('shared pace projection retains original Neuro Idea vintage and Latency records and definitions', () => {
  assert.equal(typeof pace.selectPace, 'function', 'Missing shared pace projection');
  const selected = pace.selectPace(feed);
  assert.deepEqual(selected.records.map(r => r.instrument), ['idea_vintage', 'latency_compression']);
  assert.deepEqual(selected.records.map(r => r.series.length), [27, 4]);
  for (const r of selected.records) assert.equal(r, feed.records.find(source => source.instrument === r.instrument));
  for (const d of selected.definitions) assert.equal(d, feed.instruments.find(source => source.id === d.id));
  assert.equal(selected.methodology, feed.methodology);
  assert.equal(createHash('sha256').update(JSON.stringify({ records: selected.records, definitions: selected.definitions })).digest('hex'), '298191967dc384ca41b37f7c2654536ad5e559dae86f822f3312ef884d3a5350', 'Pinned original objects independently verified against PLRD loader and PL Neuro');
});

for (const instrument of ['idea_vintage', 'latency_compression']) test(`${instrument} rejects missing, unsorted, non-year or negative readings before import`, () => {
  for (const corrupt of [r => { r.series = []; }, r => { r.series[1].x = r.series[0].x; }, r => { r.series[0].x = '2000'; }, r => { r.series[0].y = -1; }, r => { r.seriesScale = 'log'; }]) {
    const bad = structuredClone(feed);
    corrupt(bad.records.find(r => r.instrument === instrument));
    assert.throws(() => pace.selectPace(bad), /pace|year|linear|series/i);
  }
  const hidden = structuredClone(feed);
  const r = hidden.records.find(r => r.instrument === instrument);
  r.state = 'unwired'; r.candidateMetric = 'Future metric'; r.blocker = 'Not supplied'; r.series = [];
  assert.doesNotThrow(() => pace.selectPace(hidden));
});
