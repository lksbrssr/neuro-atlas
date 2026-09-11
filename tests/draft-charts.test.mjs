import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { DRAFT_CHARTS, DRAFT_CHART_CATEGORIES } from "../src/data/draft-charts.ts";
import { DraftChartsSection } from "../src/components/sections/draft-charts-section.tsx";
import { restoreFocusAfterPaneReveal } from "../src/components/chart-modal.tsx";
import { revealActiveTab, scheduleActiveTabReveal } from "../src/components/sub-tabs.tsx";
import { performanceAnchors, performanceUrl, setPerformanceFocusReturn, takePerformanceFocusReturn } from "../src/lib/field-velocity/navigation.ts";

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

test("a Draft chart link records its exact return focus target", () => {
  const dom = new JSDOM('<a href="#tissue-mapped">Open metric</a>');
  try {
    const link = dom.window.document.querySelector("a");
    setPerformanceFocusReturn(link);
    assert.equal(takePerformanceFocusReturn(), link);
    assert.equal(takePerformanceFocusReturn(), null);
  } finally {
    dom.window.close();
  }
});

test("Draft chart readiness labels are constrained on narrow screens", () => {
  const css = readFileSync("src/components/performance-curves.css", "utf8");
  assert.match(css, /@media \(max-width: 560px\) \{[^}]*\.draft-chart-readiness[^}]*max-width:/);
});

test("The three-position Field velocity rail contains overflow on narrow screens", () => {
  const source = readFileSync("src/components/sub-tabs.tsx", "utf8");
  assert.match(source, /max-w-full overflow-x-auto/);
  assert.match(source, /shrink-0/);
});

test("a Draft chart metric link regains focus only after its hidden pane is visible", () => {
  const dom = new JSDOM('<div hidden><a href="#tissue-mapped">Open metric</a></div>', { pretendToBeVisual: true });
  try {
    const pane = dom.window.document.querySelector("div");
    const link = dom.window.document.querySelector("a");
    const frames = [];
    dom.window.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
    restoreFocusAfterPaneReveal(link);
    assert.equal(dom.window.document.activeElement, dom.window.document.body);
    assert.equal(frames.length, 1);
    frames.shift()(0);
    assert.equal(dom.window.document.activeElement, dom.window.document.body);
    assert.equal(frames.length, 1);
    pane.hidden = false;
    frames.shift()(0);
    assert.equal(dom.window.document.activeElement, link);
  } finally {
    dom.window.close();
  }
});

test("the active narrow rail tab is revealed by scrolling only the rail", () => {
  const dom = new JSDOM('<div><button>Draft charts</button></div>');
  try {
    const rail = dom.window.document.querySelector("div");
    const active = dom.window.document.querySelector("button");
    rail.getBoundingClientRect = () => ({ left: 33, right: 272 });
    active.getBoundingClientRect = () => ({ left: 250, right: 314 });
    rail.scrollLeft = 0;
    revealActiveTab(rail, active);
    assert.equal(rail.scrollLeft, 42);
    assert.equal(dom.window.document.documentElement.scrollLeft, 0);
  } finally {
    dom.window.close();
  }
});

test("the active narrow rail tab is revealed again after the final layout frame", () => {
  const dom = new JSDOM('<div><button>Draft charts</button></div>', { pretendToBeVisual: true });
  try {
    const rail = dom.window.document.querySelector("div");
    const active = dom.window.document.querySelector("button");
    rail.getBoundingClientRect = () => ({ left: 33, right: 272 });
    active.getBoundingClientRect = () => ({ left: 250, right: 314 });
    let frame;
    dom.window.requestAnimationFrame = callback => { frame = callback; return 1; };
    scheduleActiveTabReveal(rail, active);
    assert.equal(rail.scrollLeft, 0);
    frame(0);
    assert.equal(rail.scrollLeft, 42);
    assert.equal(dom.window.document.documentElement.scrollLeft, 0);
  } finally {
    dom.window.close();
  }
});
