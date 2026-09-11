/** Conditional model output is separate from canonical source observations. */
export type TrendObservation = { date: string; value: number; track: string };
export type ExponentialFit = {
  slope: number;
  doublingYears: number;
  anchor: { year: number; value: number };
  observationCount: number;
};

export function decimalYear(date: string): number {
  const time = Date.parse(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== date) return NaN;
  const year = new Date(time).getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  return year + (time - start) / (Date.UTC(year + 1, 0, 1) - start);
}

/** OLS ln(value) slope; continuation is anchored to the latest actual value. */
export function fitAnchoredExponential(points: readonly TrendObservation[]): ExponentialFit | null {
  if (points.length < 3 || new Set(points.map(p => p.track)).size !== 1) return null;
  const samples = points.map(p => ({ year: decimalYear(p.date), value: p.value })).sort((a, b) => a.year - b.year);
  if (samples.some(p => !Number.isFinite(p.year) || !Number.isFinite(p.value) || p.value <= 0) || new Set(samples.map(p => p.year)).size < 3) return null;
  const anchor = samples[samples.length - 1];
  if (samples.every(p => p.value === samples[0].value) || samples.some(p => p.year === anchor.year && p.value !== anchor.value)) return null;
  const meanYear = samples.reduce((sum, p) => sum + p.year, 0) / samples.length;
  const meanLog = samples.reduce((sum, p) => sum + Math.log(p.value), 0) / samples.length;
  const variance = samples.reduce((sum, p) => sum + (p.year - meanYear) ** 2, 0);
  const slope = samples.reduce((sum, p) => sum + (p.year - meanYear) * (Math.log(p.value) - meanLog), 0) / variance;
  if (!Number.isFinite(slope) || slope <= 0) return null;
  return { slope, doublingYears: Math.log(2) / slope, anchor, observationCount: samples.length };
}

export const MAX_EXTRAPOLATION_YEAR = 2200;
export type Crossing = { status: "in-range"; year: number } | { status: "beyond-range" | "already-reached" | "unavailable" };

export function targetCrossing(fit: ExponentialFit | null, target: number, horizon = MAX_EXTRAPOLATION_YEAR): Crossing {
  if (!fit || !Number.isFinite(target) || target <= 0 || !Number.isFinite(horizon)) return { status: "unavailable" };
  if (target <= fit.anchor.value) return { status: "already-reached" };
  const year = fit.anchor.year + (Math.log(target) - Math.log(fit.anchor.value)) / fit.slope;
  if (!Number.isFinite(year) || year > Math.min(horizon, MAX_EXTRAPOLATION_YEAR)) return { status: "beyond-range" };
  return { status: "in-range", year };
}

export type ExtrapolationKind = "neurons" | "hours";
type Target = { id: string; value: number; label: string; sourceUrl?: string; sourceLabel?: string };
const targets: Record<ExtrapolationKind, readonly Target[]> = {
  neurons: [
    { id: "mouse-brain", value: 70_000_000, label: "Mouse whole-brain live target · ≈70M neurons", sourceUrl: "https://doi.org/10.1073/pnas.0604911103", sourceLabel: "Herculano-Houzel et al. (2006) · mouse neuron-count reference" },
    { id: "human-brain", value: 86_000_000_000, label: "Human whole-brain live target · ≈86B neurons", sourceUrl: "https://doi.org/10.1002/cne.21974", sourceLabel: "Azevedo et al. (2009) · human neuron-count reference" },
  ],
  hours: [
    { id: "hours-milestone", value: 100_000, label: "100,000 h · human-data milestone" },
    { id: "hours-article", value: 100_000_000, label: "100 million h · human-data article goal", sourceUrl: "https://www.plrd.org/blog/neurotech-frontier-human-flourishing/", sourceLabel: "PL R&D article · 100 million hours" },
  ],
};

export function extrapolationScenario(kind: ExtrapolationKind, points: readonly TrendObservation[], selectedTrack = "") {
  const track = kind === "neurons" ? "neuron-frontier" : "tusz-scalp-eeg";
  const fit = !selectedTrack || selectedTrack === track ? fitAnchoredExponential(points.filter(p => p.track === track)) : null;
  const milestones = targets[kind].map(t => ({ ...t, crossing: targetCrossing(fit, t.value) }));
  const sourceYears = points.map(p => decimalYear(p.date)).filter(Number.isFinite);
  const lastSourceYear = sourceYears.length ? Math.max(...sourceYears) : 2000;
  const crossingYears = milestones.flatMap(t => t.crossing.status === "in-range" ? [t.crossing.year] : []);
  const endYear = fit ? (milestones.some(t => t.crossing.status === "beyond-range") ? MAX_EXTRAPOLATION_YEAR : Math.max(fit.anchor.year, ...crossingYears)) : lastSourceYear;
  const horizon = Math.min(MAX_EXTRAPOLATION_YEAR, Math.ceil(Math.max(lastSourceYear, endYear) / 10) * 10);
  const samples = fit && endYear > fit.anchor.year ? Array.from({ length: 65 }, (_, i) => {
    const year = fit.anchor.year + (endYear - fit.anchor.year) * i / 64;
    return { year, value: valueAtYear(fit, year) };
  }) : [];
  return { kind, fit, targets: milestones, horizon, samples };
}
export type ExtrapolationScenario = ReturnType<typeof extrapolationScenario>;

export function valueAtYear(fit: ExponentialFit, year: number): number {
  return fit.anchor.value * Math.exp(fit.slope * (year - fit.anchor.year));
}
