import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

test("milestone timeline includes screened 2024 and 2025 pathway events", async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const milestones = JSON.parse(await readFile(path.join(here, "..", "src", "data", "milestones.json"), "utf8"));
  const years = Object.fromEntries(
    ["2024", "2025", "2026"].map((year) => [year, milestones.filter((row) => (row.date ?? "").startsWith(year)).length]),
  );
  assert.equal(years["2024"] >= 10, true, JSON.stringify(years));
  assert.equal(years["2025"] >= 5, true, JSON.stringify(years));
  assert.equal(years["2026"] >= 28, true, JSON.stringify(years));
  assert.equal(milestones.some((row) => row.company === "Neuralink" && row.activity === "FIH"), true);
  assert.equal(milestones.some((row) => row.company === "Precision Neuroscience" && row.activity === "510(k)"), true);
});

test("sourced 2024 and 2025 capital-lane amounts reach the year totals", async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const milestones = JSON.parse(await readFile(path.join(here, "..", "src", "data", "milestones.json"), "utf8"));
  const sumYear = (year) =>
    milestones
      .filter((row) => row.stage === "capital" && (row.date ?? "").startsWith(String(year)) && row.amountUsdM)
      .reduce((sum, row) => sum + row.amountUsdM, 0);
  assert.equal(sumYear(2024), 260);
  assert.equal(sumYear(2025), 322);
  assert.equal(milestones.some((row) => row.company === "Precision Neuroscience" && row.stage === "capital"), true);
  assert.equal(milestones.some((row) => row.company === "Science Corp" && row.stage === "capital" && (row.date ?? "").startsWith("2025")), true);
  assert.equal(
    milestones
      .filter((row) => row.stage === "capital" && (row.date ?? "").startsWith("2024") || (row.date ?? "").startsWith("2025") && row.stage === "capital")
      .every((row) => typeof row.sourceUrl === "string" && row.sourceUrl.startsWith("https://")),
    true,
  );
});
