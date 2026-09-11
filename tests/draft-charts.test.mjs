import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { DRAFT_CHARTS, DRAFT_CHART_CATEGORIES } from "../src/data/draft-charts.ts";
import { DraftChartsSection } from "../src/components/sections/draft-charts-section.tsx";
import { performanceAnchors, performanceUrl } from "../src/lib/field-velocity/navigation.ts";

const manifest = [
  "Brain tissue mapped over time",
  "Largest published connectome over time",
  "Connectomics imaging throughput over time",
  "Cost to map 1 cm³ over time",
  "Automated reconstruction accuracy over time",
  "Human proofreading burden over time",
  "Human tissue preservation quality over time",
  "Tissue loss in subdivision/sectioning over time",
  "Molecular annotation coverage over time",
  "Humans with implanted high-bandwidth BCIs over time",
  "Neural recording hours collected over time",
  "Paired structure–function dataset scale over time",
  "Comparative connectomics cohort size over time",
  "Open-access connectomics data over time",
  "Public connectome reuse over time",
  "Simulation/emulation fidelity over time",
  "Number of simulations/emulations over time",
  "NeuroAI performance–cost frontier over time",
  "Demonstrated applications enabled by connectomics over time",
];

test("Draft charts preserves all 19 authorized technical definitions exactly once across six categories", () => {
  assert.equal(DRAFT_CHARTS.length, 19);
  assert.deepEqual(DRAFT_CHARTS.map(chart => chart.title), manifest);
  assert.equal(new Set(DRAFT_CHARTS.map(chart => chart.title)).size, 19);
  assert.deepEqual(DRAFT_CHART_CATEGORIES, [
    "Mapping scale",
    "Cost and automation",
    "Tissue quality and annotation",
    "Human interfaces and recordings",
    "Data access and scientific use",
    "Simulation, NeuroAI, and impact",
  ]);
  assert.deepEqual([...new Set(DRAFT_CHARTS.map(chart => chart.category))], DRAFT_CHART_CATEGORIES);
  for (const chart of DRAFT_CHARTS) {
    assert.match(chart.axes, /x-axis:/i);
    assert.match(chart.axes, /y-axis:/i);
    assert.ok(chart.constraint.length > 35, `${chart.title} needs a comparability constraint`);
    assert.equal(chart.readiness, "No observations assembled");
  }
});

test("Draft chart manifest is a stable, sanitized technical definition set", () => {
  const digest = createHash("sha256").update(JSON.stringify(DRAFT_CHARTS)).digest("hex");
  assert.equal(digest, "65192236b6be5b3d5266bba16fed28d8f0bf2fa0b28e6b1255988e3969a0e0ef");
  const serialized = JSON.stringify(DRAFT_CHARTS);
  assert.doesNotMatch(serialized, /https?:\/\//i);
  assert.doesNotMatch(serialized, /\b(?:meeting|discussion|participant|comment|private URL)\b/i);
});

test("Draft charts renders definition-only cards without invented observations and links only bounded existing charts", () => {
  globalThis.React = React;
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(DraftChartsSection)));
  try {
    const document = dom.window.document;
    assert.equal(document.querySelectorAll("[data-draft-chart-card]").length, 19);
    assert.equal(document.querySelectorAll("[data-draft-chart-category]").length, 6);
    assert.equal(document.querySelectorAll("[data-draft-chart-readiness]").length, 19);
    assert.match(document.body.textContent, /Definition draft/);
    assert.equal(document.querySelectorAll("svg, [data-curve-point], [data-source-observation]").length, 0);
    assert.deepEqual([...document.querySelectorAll("[data-draft-chart-card] a")].map(link => link.getAttribute("href")), ["#tissue-mapped", "#neural-recording-hours"]);
    assert.match(document.body.textContent, /mm³.*cm³|cm³.*mm³/i);
    assert.match(document.body.textContent, /static connectome.*living recording|living recording.*static connectome/i);
  } finally {
    dom.window.close();
  }
});

test("Draft charts is a stable non-modal tab location", () => {
  assert.ok(performanceAnchors.includes("draft-charts"));
  assert.equal(performanceUrl("https://atlas.example/field-velocity?review=1#old", "draft-charts"), "https://atlas.example/field-velocity?review=1#draft-charts");
});
