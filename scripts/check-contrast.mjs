#!/usr/bin/env node
// Asserts WCAG contrast for the design-token pairs that actually carry text or
// non-text UI meaning, in both themes. Parses src/app/globals.css directly so
// the check can't drift from the shipped tokens. Fails loudly (exit 1).
//
// Text pairs need ≥4.5:1 (AA); non-text marks (rings, dots, bars) need ≥3:1.

import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(
  path.join(import.meta.dirname, "..", "src", "app", "globals.css"),
  "utf8",
);

function block(selector) {
  const re = new RegExp(`(?:^|\\n)\\s*${selector.replace(".", "\\.")}\\s*\\{([\\s\\S]*?)\\n\\}`);
  const m = css.match(re);
  if (!m) throw new Error(`Could not find ${selector} block in globals.css`);
  const vars = {};
  for (const [, name, value] of m[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    vars[name] = value.trim();
  }
  return vars;
}

function parseColor(raw, vars) {
  let v = raw.trim();
  const ref = v.match(/^var\(--([\w-]+)\)$/);
  if (ref) v = vars[ref[1]];
  if (!v) return null;
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgba = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (rgba) return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] ? Number(rgba[4]) : 1];
  return null;
}

// Composite a (possibly translucent) colour over an opaque background.
function over(fg, bg) {
  const a = fg[3];
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
}

function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// [foreground token, background token, minimum ratio, note]
const PAIRS = [
  ["foreground", "surface", 4.5, "body text"],
  ["foreground", "surface-raised", 4.5, "body text on raised surface"],
  ["muted", "surface", 4.5, "secondary text"],
  ["muted", "surface-raised", 4.5, "secondary text on raised surface"],
  ["faint", "surface", 4.5, "caption text"],
  ["accent", "surface", 4.5, "links / eyebrows"],
  ["accent-foreground", "accent", 4.5, "text on accent fills"],
  ["accent", "accent-soft", 4.5, "accent text on accent tint"],
  ["positive", "positive-soft", 4.5, "status pill text"],
  ["negative", "negative-soft", 4.5, "status pill text"],
  ["warning", "warning-soft", 4.5, "status pill text"],
  ["stage-capital", "surface", 3, "stage marks (non-text)"],
  ["stage-clinical", "surface", 3, "stage marks (non-text)"],
  ["stage-commercial", "surface", 3, "stage marks (non-text)"],
  ["stage-capital", "stage-capital-soft", 3, "stage marks on own lane tint"],
  ["stage-clinical", "stage-clinical-soft", 3, "stage marks on own lane tint"],
  ["stage-commercial", "stage-commercial-soft", 3, "stage marks on own lane tint"],
  ["border-strong", "surface", 1.29, "hairlines (decorative, tracked only)"],
];

let failed = 0;
for (const [themeName, selector] of [
  ["light", ":root"],
  ["dark", ".dark"],
]) {
  const vars = block(selector);
  const surface = parseColor(vars.surface, vars);
  for (const [fgName, bgName, min, note] of PAIRS) {
    const fgRaw = parseColor(vars[fgName], vars);
    const bgRaw = parseColor(vars[bgName], vars);
    if (!fgRaw || !bgRaw) {
      console.error(`✗ [${themeName}] missing token: ${fgName} or ${bgName}`);
      failed++;
      continue;
    }
    const bg = over(bgRaw, surface);
    const fg = over(fgRaw, bg);
    const r = ratio(fg, bg);
    const ok = r >= min;
    const line = `[${themeName}] ${fgName} on ${bgName}: ${r.toFixed(2)}:1 (need ${min}:1) — ${note}`;
    if (ok) console.log(`✓ ${line}`);
    else {
      console.error(`✗ ${line}`);
      failed++;
    }
  }
}

if (failed) {
  console.error(`\n${failed} contrast pair(s) below threshold.`);
  process.exit(1);
}
console.log("\nAll contrast pairs pass.");
