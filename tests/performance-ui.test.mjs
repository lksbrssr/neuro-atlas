import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseFeed } from "../src/lib/field-velocity/schema.ts";
import { selectPerformance } from "../src/lib/field-velocity/performance.ts";
const data = selectPerformance(parseFeed(JSON.parse(readFileSync("src/data/field-velocity/neurotech.snapshot.json", "utf8"))));
const provenance = JSON.parse(readFileSync("src/data/field-velocity/neurotech.snapshot.json.provenance.json", "utf8"));

test("performance UI offers three native expandable cards, original methodology and every sourced checkpoint", async () => {
  assert.ok(existsSync("src/components/performance-curves.tsx"), "Missing expandable performance cards");
  const { PerformanceCurves } = await import("../src/components/performance-curves.tsx");
  const html = renderToStaticMarkup(React.createElement(PerformanceCurves, { data, provenance }));
  assert.equal((html.match(/class="pc-share"/g) ?? []).length, 3, "Every curve needs a discoverable share control");
  assert.equal((html.match(/>Copy link<\/button>/g) ?? []).length, 3);
  for (const id of ["simultaneously-recorded-neurons", "tissue-mapped", "neural-recording-hours"]) assert.ok(html.includes(`href="#${id}"`));
  assert.equal((html.match(/data-performance-card=/g) ?? []).length, 3);
  assert.equal((html.match(/data-source-observation=/g) ?? []).length, 25);
  assert.equal((html.match(/<circle[^>]*tabindex="0"/g) ?? []).length, 25, "Every expanded observation must be keyboard reachable");
  assert.match(html, /Definitions &amp; methodology/);
  assert.match(html, /Historical series/);
  assert.doesNotMatch(html, /accelerating|live feed|<dialog|bci-implants/);
  assert.match(html, /More than 100 hours/);
  assert.match(html, /0\.00819/);
  for (const s of data.measurements) {
    assert.ok(html.includes(s.caveat.replaceAll("&", "&amp;").replaceAll("'", "&#x27;")));
    for (const t of s.tracks) for (const p of t.points) {
      assert.ok(html.includes(p.sourceUrl.replaceAll("&", "&amp;")), p.sourceUrl);
    }
  }
});
