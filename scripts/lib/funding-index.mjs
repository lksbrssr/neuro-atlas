import { readFile } from "node:fs/promises";
import path from "node:path";

export const MINIMUM_ROUND_USD_M = 2;

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ""; }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
    else if (char !== '\r') field += char;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];
  const headers = rows[0].map((value) => value.trim());
  return rows.slice(1).filter((values) => values.some(Boolean)).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()])),
  );
}

export async function loadFundingIndexSources(directory) {
  const load = async (name) => parseCsv(await readFile(path.join(directory, name), "utf8"));
  const [companies, rounds, milestones] = await Promise.all([
    load("companies.csv"),
    load("rounds.csv"),
    load("milestones.csv"),
  ]);
  return { companies, rounds, milestones };
}

export function buildFundingIndex({ companies, rounds, milestones }) {
  const normalizedCompanies = companies.map((company) => ({
    slug: company.slug,
    name: company.name,
    hq: company.hq,
    modality: company.modality,
    interfaceDepth: company.interface_depth,
    indication: company.indication,
    website: company.website,
    scope: company.scope,
  }));
  const companySlugs = new Set(normalizedCompanies.map((company) => company.slug));
  const parsedRounds = rounds.map((round) => {
    if (!companySlugs.has(round.company_slug)) throw new Error(`Unknown company slug: ${round.company_slug}`);
    const amountUsdM = Number(round.amount_usd_m);
    return {
      companySlug: round.company_slug,
      announcedOn: round.announced_on,
      datePrecision: round.date_precision,
      stage: round.stage,
      amountUsdM,
      amountNativeM: round.amount_native_m ? Number(round.amount_native_m) : null,
      currency: round.currency,
      displayAmount: round.display_amount,
      investors: round.investors ? round.investors.split(";").map((name) => name.trim()).filter(Boolean) : [],
      sourceUrl: round.source_url,
      note: round.note,
    };
  });
  const includedRounds = parsedRounds.filter((round) =>
    Number.isFinite(round.amountUsdM) && round.amountUsdM >= MINIMUM_ROUND_USD_M,
  );

  const investorMap = new Map();
  for (const round of includedRounds) {
    for (const name of round.investors) {
      const current = investorMap.get(name) ?? { name, roundCount: 0, companySlugs: new Set(), associatedCapitalUsdM: 0 };
      current.roundCount += 1;
      current.companySlugs.add(round.companySlug);
      current.associatedCapitalUsdM += round.amountUsdM;
      investorMap.set(name, current);
    }
  }
  const investors = [...investorMap.values()]
    .map((investor) => ({
      name: investor.name,
      roundCount: investor.roundCount,
      companyCount: investor.companySlugs.size,
      associatedCapitalUsdM: Number(investor.associatedCapitalUsdM.toFixed(2)),
    }))
    .sort((a, b) => b.roundCount - a.roundCount || b.companyCount - a.companyCount || a.name.localeCompare(b.name));

  const normalizedMilestones = milestones.map((milestone) => {
    if (!companySlugs.has(milestone.company_slug)) throw new Error(`Unknown company slug: ${milestone.company_slug}`);
    return {
      companySlug: milestone.company_slug,
      announcedOn: milestone.announced_on,
      datePrecision: milestone.date_precision,
      marker: milestone.marker,
      indication: milestone.indication,
      sourceUrl: milestone.source_url,
      note: milestone.note,
    };
  });

  return {
    companies: normalizedCompanies,
    rounds: includedRounds,
    milestones: normalizedMilestones,
    investors,
    summary: { excludedBelowThreshold: rounds.length - includedRounds.length },
  };
}

export function buildCompanyRows(companies, rounds, filters) {
  const query = filters.query.trim().toLowerCase();
  const roundsByCompany = new Map();
  for (const round of rounds) {
    const current = roundsByCompany.get(round.companySlug) ?? [];
    current.push(round);
    roundsByCompany.set(round.companySlug, current);
  }

  return companies
    .filter((company) => filters.scope === "All" || company.scope === filters.scope)
    .filter((company) => filters.modality === "All" || company.modality === filters.modality)
    .filter((company) => {
      if (!query) return true;
      return [company.name, company.modality, company.indication, company.hq ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .map((company) => {
      const companyRounds = [...(roundsByCompany.get(company.slug) ?? [])].sort((a, b) =>
        a.announcedOn.localeCompare(b.announcedOn),
      );
      return {
        ...company,
        observedCapitalUsdM: Number(companyRounds.reduce((total, round) => total + round.amountUsdM, 0).toFixed(2)),
        latestStage: companyRounds.at(-1)?.stage ?? "Undisclosed",
        rounds: companyRounds,
      };
    })
    .sort((a, b) => b.observedCapitalUsdM - a.observedCapitalUsdM || a.name.localeCompare(b.name));
}

export function getTimelinePosition(announcedOn, firstYear, lastYear) {
  const start = Date.UTC(firstYear, 0, 1);
  const end = Date.UTC(lastYear, 11, 31);
  const point = Date.parse(`${announcedOn}T00:00:00Z`);
  if (!Number.isFinite(point) || end <= start) return 0;
  return Math.min(100, Math.max(0, ((point - start) / (end - start)) * 100));
}

export function formatCapital(amountUsdM) {
  const value = amountUsdM >= 1000 ? amountUsdM / 1000 : amountUsdM;
  const suffix = amountUsdM >= 1000 ? "B" : "M";
  const maximumFractionDigits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value)}${suffix}`;
}
