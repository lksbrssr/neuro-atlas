#!/usr/bin/env node
// Generates src/data/*.json from the canonical files in data/.
// Run after editing anything in data/:  node scripts/generate-derived.mjs

import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const DATA = path.join(ROOT, "data");
const OUT = path.join(ROOT, "src", "data");
const PUB_LOGOS = path.join(ROOT, "public", "logos");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(PUB_LOGOS, { recursive: true });

function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
      } else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); cell = ""; if (row.some((x) => x !== "")) rows.push(row); row = []; }
    else if (c !== "\r") cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); if (row.some((x) => x !== "")) rows.push(row); }
  const [header, ...rest] = rows;
  return rest.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ── Logos manifest ────────────────────────────────────────────────────────────
const manifest = parseCSV(fs.readFileSync(path.join(DATA, "logos", "manifest.csv"), "utf8"));
const logoBySlug = Object.fromEntries(
  manifest.filter((m) => m.status === "ok").map((m) => [m.slug, m.file]),
);

// ── Milestones ────────────────────────────────────────────────────────────────
const msRows = parseCSV(fs.readFileSync(path.join(DATA, "market-memo-q1-2026", "milestones.csv"), "utf8"));
const usedLogos = new Set();
const milestones = msRows.map((r) => {
  const slug = slugify(r.company);
  const logoFile = logoBySlug[slug];
  if (logoFile) usedLogos.add(logoFile);
  return {
    company: r.company,
    slug,
    activity: r.activity,
    stage: r.stage,
    amountUsdM: r.amount_usd_m ? Number(r.amount_usd_m) : null,
    date: r.date || null,
    datePrecision: r.date_precision || "window",
    note: r.note || null,
    sourceUrl: r.source_url || null,
    logo: logoFile ? `/logos/${logoFile}` : null,
  };
});
fs.writeFileSync(path.join(OUT, "milestones.json"), JSON.stringify(milestones, null, 2));

// copy only the logos we reference (milestones now; landscape uses remote CDN urls)
for (const f of usedLogos) {
  const src = path.join(DATA, "logos", f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(PUB_LOGOS, f));
}

// ── Acronyms (tooltip glossary) ───────────────────────────────────────────────
const acr = parseCSV(fs.readFileSync(path.join(DATA, "glossary", "acronyms.csv"), "utf8"));
fs.writeFileSync(
  path.join(OUT, "acronyms.json"),
  JSON.stringify(Object.fromEntries(acr.map((a) => [a.acronym, { expansion: a.expansion, definition: a.definition }])), null, 2),
);

// ── Landscape (slim company records + facet metadata) ────────────────────────
const companies = JSON.parse(fs.readFileSync(path.join(DATA, "neurofounders", "companies.json"), "utf8"));
const normCountry = (c) => {
  const m = { "United States": "USA", "United Kingdom": "UK", US: "USA" };
  return m[c] ?? c;
};
const slim = companies.map((c) => ({
  slug: c.slug,
  name: c.name,
  country: normCountry(c.country),
  category: c.category,
  tags: c.tags ? c.tags.split("; ").filter(Boolean) : [],
  founded: c.founded ? Number(c.founded) : null,
  fundingStage: c.funding_stage || "Unknown",
  modality: c.modality || "Other",
  formFactor: c.form_factor || "",
  interfaceDepth: c.interface_depth || "",
  indication: c.indication || "",
  targetUser: c.target_user || "",
  regulatoryStage: c.regulatory_stage || "",
  website: c.website || null,
  logoUrl: c.logo_url || null,
}));
fs.writeFileSync(path.join(OUT, "landscape.json"), JSON.stringify(slim));

// ── Field velocity (copy through) ─────────────────────────────────────────────
const velDir = path.join(OUT, "velocity");
fs.mkdirSync(velDir, { recursive: true });
for (const f of ["instruments.json", "neurotech_records.json", "neurotech_inflection_points.json", "neurotech_market_signals.json"]) {
  fs.copyFileSync(path.join(DATA, "field-velocity", f), path.join(velDir, f));
}

// ── Capital by year ───────────────────────────────────────────────────────────
const cap = parseCSV(fs.readFileSync(path.join(DATA, "market-memo-q1-2026", "capital_by_year.csv"), "utf8"));
fs.writeFileSync(
  path.join(OUT, "capital.json"),
  JSON.stringify(cap.map((r) => ({ year: Number(r.year), usdM: Number(r.new_capital_usd_m), note: r.period_note })), null, 2),
);

console.log(`milestones: ${milestones.length} | companies: ${slim.length} | acronyms: ${acr.length} | logos copied: ${usedLogos.size}`);
