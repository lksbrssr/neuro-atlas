import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function clampCenteredTooltipX(anchorCenterX, tooltipWidthPx, viewportWidth, pad = 12) {
  const half = tooltipWidthPx / 2;
  const min = half + pad;
  const max = Math.max(min, viewportWidth - half - pad);
  return Math.min(Math.max(anchorCenterX, min), max);
}

test("left-edge tooltip stays fully on screen", () => {
  assert.equal(clampCenteredTooltipX(20, 256, 1280), 140);
  assert.equal(clampCenteredTooltipX(640, 256, 1280), 640);
  assert.equal(clampCenteredTooltipX(1270, 256, 1280), 1140);
});

test("timeline, funding index, and glossary clamp centered tooltips", async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.join(here, "..");
  const files = [
    "src/lib/tooltip-position.ts",
    "src/components/milestone-timeline.tsx",
    "src/components/funding-index-dashboard.tsx",
    "src/components/abbr.tsx",
  ];
  for (const rel of files) {
    const src = await readFile(path.join(root, rel), "utf8");
    assert.match(src, /clampCenteredTooltipX/, rel);
  }
});
