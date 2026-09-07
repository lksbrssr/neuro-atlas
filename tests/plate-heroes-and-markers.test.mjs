import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

test("every content plate uses the shared dark PlateHero", async () => {
  const pages = [
    "src/app/milestones/page.tsx",
    "src/app/ecosystem/page.tsx",
    "src/app/funding/page.tsx",
    "src/app/field-velocity/page.tsx",
    "src/app/methodology/page.tsx",
  ];
  for (const rel of pages) {
    const src = await readFile(path.join(root, rel), "utf8");
    assert.match(src, /PlateHero/, rel);
    assert.doesNotMatch(src, /PlateHeader/, rel);
  }
});

test("funding-index markers use a real hover tooltip, not native title", async () => {
  const src = await readFile(path.join(root, "src/components/funding-index-dashboard.tsx"), "utf8");
  assert.match(src, /showMarkerTip/);
  assert.match(src, /markerTip &&/);
  assert.doesNotMatch(src, /title=\{markerTitle/);
});

test("glossary covers the regulatory markers on the funding index", async () => {
  const acronyms = JSON.parse(await readFile(path.join(root, "src/data/acronyms.json"), "utf8"));
  const index = JSON.parse(await readFile(path.join(root, "src/data/funding-index.json"), "utf8"));
  const markers = [...new Set(index.milestones.map((row) => row.marker))];
  assert.deepEqual(markers.sort(), ["BDD", "CE", "IDE", "NMPA", "Pivotal", "TAP"]);
  for (const marker of markers) {
    assert.equal(Boolean(acronyms[marker]?.expansion), true, marker);
  }
});
