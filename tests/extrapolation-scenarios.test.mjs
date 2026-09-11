import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fitAnchoredExponential, extrapolationScenario } from '../src/lib/extrapolation.ts';
const feed = JSON.parse(readFileSync('src/data/field-velocity/neurotech.snapshot.json','utf8'));
const neurons = feed.records.find(r=>r.instrument==='performance_curves').series.map(p=>({date:`${p.x}-01-01`,value:p.y,track:'neuron-frontier'}));
const hours = feed.measurementSeries.find(s=>s.id==='neural-recording-hours').tracks.flatMap(t=>t.points.map(p=>({...p,track:t.id})));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('fit diagnostics distinguish historical OLS log R-squared from the anchored scenario',()=>{
 const n=fitAnchoredExponential(neurons);
 near(n.rSquared,0.980060156214594);
 near(n.anchoredRSquared,0.9292988878681853);
 assert.equal(n.firstYear,1957);
 const h=extrapolationScenario('hours',hours).fit;
 near(h.rSquared,0.8299585564653371);
 near(h.anchoredRSquared,0.7389498541883408);
});
test('neuron scenario selection changes actual crossings and diagnostics without changing observations',()=>{
 const before=JSON.stringify(neurons);
 const recent=extrapolationScenario('neurons',neurons,'','recent');
 assert.equal(recent.fit.observationCount,4);
 assert.equal(recent.fit.firstYear,1991);
 near(recent.fit.rSquared,0.9580972287416599);
 near(recent.targets[0].crossing.year,2084.8115893415825);
 near(recent.targets[1].crossing.year,2135.218956001698);
 const literature=extrapolationScenario('neurons',neurons,'','literature');
 assert.equal(literature.fit.doublingYears,7);
 assert.equal(literature.fit.rSquared,null,'Manual literature pace is not an OLS fit');
 near(literature.targets[0].crossing.year,2014+7*Math.log2(70_000_000/3200));
 near(literature.targets[1].crossing.year,2014+7*Math.log2(86_000_000_000/3200));
 assert.deepEqual(literature.samples[0],{year:2014,value:3200});
 assert.equal(JSON.stringify(neurons),before);
});
test('retaining the last three TUSZ plateau releases gives no future crossing or invented R-squared',()=>{
 const scenario=extrapolationScenario('hours',hours,'','plateau');
 assert.equal(scenario.fit.slope,0);
 assert.equal(scenario.fit.observationCount,3);
 assert.equal(scenario.fit.rSquared,null);
 assert.equal(scenario.fit.anchoredRSquared,null);
 assert.ok(scenario.targets.every(t=>t.crossing.status==='no-crossing'));
 assert.ok(scenario.samples.length>1 && scenario.samples.every(p=>p.value===1074));
 for(const mode of ['plateau','historical']) {
   const excluded=extrapolationScenario('hours',hours,'poyo-primate-training',mode);
   assert.equal(excluded.fit,null);assert.equal(excluded.samples.length,0);
 }
});
