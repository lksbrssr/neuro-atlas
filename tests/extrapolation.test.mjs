import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const neuronPoints = [[1957, 2], [1970, 8], [1981, 18], [1991, 82], [1993, 148], [2009, 744], [2014, 3200]]
  .map(([year, value]) => ({ date: `${year}-01-01`, value, track: 'neuron-frontier' }));
const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
async function api() {
  assert.ok(existsSync('src/lib/extrapolation.ts'), 'Missing anchored extrapolation model');
  return import('../src/lib/extrapolation.ts');
}

test('rejects invalid dates/values, insufficient distinct times, mixed tracks and nonpositive growth', async () => {
  const { fitAnchoredExponential, decimalYear } = await api();
  for (const points of [
    [], neuronPoints.slice(0, 2), [neuronPoints[0], neuronPoints[0], neuronPoints[1]],
    neuronPoints.map(p => ({ ...p, value: 1 })),
    neuronPoints.map((p, i) => ({ ...p, value: 100 - i })),
    ...[0, -1, NaN, Infinity].map(value => neuronPoints.map((p, i) => i === 2 ? { ...p, value } : p)),
    ...['bad', '2020-02-30', '2020-13-01', 'Infinity', '2020-01-01T00:00:00Z'].map(date => neuronPoints.map((p, i) => i === 2 ? { ...p, date } : p)),
    neuronPoints.map((p, i) => i === 2 ? { ...p, track: 'unrelated' } : p),
  ]) assert.equal(fitAnchoredExponential(points), null, JSON.stringify(points));
  near(decimalYear('2020-07-02'), 2020.5);
  near(decimalYear('2019-07-02'), 2019 + 182 / 365);
});

test('flat noninteger series and conflicting latest anchors cannot create an artificial growth estimate', async () => {
  const { fitAnchoredExponential } = await api();
  for (const value of [0.1, 651, 1074, 1e200]) assert.equal(fitAnchoredExponential(neuronPoints.map(p => ({ ...p, value }))), null);
  const ambiguous = [...neuronPoints, { ...neuronPoints.at(-1), value: 4000 }];
  assert.equal(fitAnchoredExponential(ambiguous), null, 'Conflicting values on the last date have no unique anchor');
});

test('target crossings match independent fixtures and never invent an out-of-range date', async () => {
  const { fitAnchoredExponential, targetCrossing } = await api();
  assert.equal(typeof targetCrossing, 'function', 'Missing bounded target crossing');
  const fit = fitAnchoredExponential(neuronPoints);
  near(targetCrossing(fit, 70_000_000).year, 2093.5872626563255);
  near(targetCrossing(fit, 86_000_000_000).year, 2150.241609317579);
  assert.equal(targetCrossing(fit, 86_000_000_000).status, 'in-range');
  assert.deepEqual(targetCrossing(fit, 1e100), { status: 'beyond-range' });
  assert.deepEqual(targetCrossing(fit, 1e100, 9999), { status: 'beyond-range' }, 'Hard horizon is 2200');
  assert.deepEqual(targetCrossing(fit, 86_000_000_000, 2100), { status: 'beyond-range' });
  assert.deepEqual(targetCrossing(fit, 3200), { status: 'already-reached' });
  for (const target of [NaN, Infinity, 0, -1]) assert.deepEqual(targetCrossing(fit, target), { status: 'unavailable' });
  assert.deepEqual(targetCrossing(null, 70_000_000), { status: 'unavailable' });
});

test('hours scenario fits only all eight TUSZ release totals, retaining plateaus and ignoring other datasets', async () => {
  const { extrapolationScenario } = await api();
  assert.equal(typeof extrapolationScenario, 'function', 'Missing per-chart scenario selection');
  const feed = JSON.parse(readFileSync('src/data/field-velocity/neurotech.snapshot.json', 'utf8'));
  const points = feed.measurementSeries.find(s => s.id === 'neural-recording-hours').tracks.flatMap(t => t.points.map(p => ({ ...p, track: t.id })));
  const before = JSON.stringify(points);
  const scenario = extrapolationScenario('hours', points);
  assert.equal(scenario.fit.observationCount, 8);
  near(scenario.fit.slope, 0.4977159633696027);
  near(scenario.fit.anchor.year, 2020.3524590163934);
  assert.equal(scenario.fit.anchor.value, 1074);
  assert.deepEqual(scenario.targets.map(t => t.value), [100_000, 100_000_000]);
  near(scenario.targets[0].crossing.year, 2029.4616307600666);
  near(scenario.targets[1].crossing.year, 2043.3405411976898);
  assert.deepEqual(extrapolationScenario('hours', points, 'tusz-scalp-eeg'), scenario);
  assert.deepEqual(extrapolationScenario('hours', points.map(p => p.track === 'tusz-scalp-eeg' ? p : { ...p, value: 1e9 })).fit, scenario.fit);
  for (const track of ['ajile12-intracranial', 'poyo-primate-training', 'japaneeg-scalp-eeg', 'unknown']) {
    const unsupported = extrapolationScenario('hours', points, track);
    assert.equal(unsupported.fit, null);
    assert.deepEqual(unsupported.samples, []);
    assert.ok(unsupported.targets.every(t => t.crossing.status === 'unavailable'));
  }
  assert.equal(JSON.stringify(points), before, 'Never mutate or sum source observations');
  assert.equal(scenario.samples[0].year, scenario.fit.anchor.year);
  assert.equal(scenario.samples[0].value, 1074);
  assert.ok(scenario.samples.every(p => p.year <= 2200 && Number.isFinite(p.value) && p.value > 0));
});

test('neuron scenario separates whole-brain target assumptions from actual observations and caps slow continuations', async () => {
  const { extrapolationScenario } = await api();
  const scenario = extrapolationScenario('neurons', neuronPoints);
  assert.deepEqual(scenario.targets.map(t => t.value), [70_000_000, 86_000_000_000]);
  assert.ok(scenario.targets.every(t => t.sourceUrl.startsWith('https://doi.org/')));
  assert.equal(scenario.horizon, 2160);
  assert.deepEqual(scenario.samples[0], { year: 2014, value: 3200 });
  near(scenario.samples.at(-1).value, 86_000_000_000, 0.01);
  const slow = extrapolationScenario('neurons', neuronPoints.map((p, i) => ({ ...p, value: 2 + i / 100 })));
  assert.equal(slow.horizon, 2200);
  assert.equal(slow.samples.at(-1).year, 2200);
  assert.ok(slow.targets.every(t => t.crossing.status === 'beyond-range'));
  for (const invalid of [[], neuronPoints.slice(0, 2), neuronPoints.map(p => ({ ...p, value: 2 }))]) {
    const unavailable = extrapolationScenario('neurons', invalid);
    assert.equal(unavailable.fit, null);
    assert.equal(unavailable.samples.length, 0);
    assert.ok(unavailable.targets.every(t => t.crossing.status === 'unavailable'));
    assert.ok(Number.isFinite(unavailable.horizon));
  }
});

test('fits all seven selected neuron points but anchors at the last actual, not the OLS intercept', async () => {
  const { fitAnchoredExponential, valueAtYear } = await api();
  const fit = fitAnchoredExponential(neuronPoints);
  // Independent centered-OLS fixture; these are not the literature seven-year estimate.
  near(fit.slope, 0.12556154562543675);
  near(fit.doublingYears, 5.520377892031338, 1e-8);
  assert.deepEqual(fit.anchor, { year: 2014, value: 3200 });
  assert.equal(fit.observationCount, 7);
  assert.equal(valueAtYear(fit, 2014), 3200);
  assert.deepEqual(fitAnchoredExponential([...neuronPoints].reverse()), fit, 'Source ordering does not affect the fit');
});
