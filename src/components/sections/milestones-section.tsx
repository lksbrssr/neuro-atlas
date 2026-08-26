import { MilestoneTimeline } from "@/components/milestone-timeline";
import MILESTONES from "@/data/milestones.json";
import CAPITAL from "@/data/capital.json";

// Three-up hero stat line: new capital by year, where a reader actually
// starts. 2024/2025 come from the memo's full-year comparison basis
// (capital.json); 2026 is computed live from the tracked capital events.
function HeroStats() {
  const caps2026 = MILESTONES.filter((m) => m.stage === "capital" && m.date);
  const usd2026 = caps2026.reduce((s, m) => s + (m.amountUsdM ?? 0), 0);
  const dates = caps2026.map((m) => m.date!).sort();
  const fmtMonth = (d: string) =>
    new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const period = dates.length ? `${fmtMonth(dates[0])}–${fmtMonth(dates[dates.length - 1])}` : "";
  const rounds = caps2026.filter((m) => m.amountUsdM).length;

  const items = [
    ...CAPITAL.filter((c) => c.year < 2026).map((c) => ({
      year: String(c.year),
      value: c.usdM >= 1000 ? `$${(c.usdM / 1000).toFixed(1)}b` : `$${Math.round(c.usdM)}m`,
      note: "full year",
    })),
    {
      year: "2026",
      value: usd2026 >= 1000 ? `$${(usd2026 / 1000).toFixed(1)}b` : `$${Math.round(usd2026)}m`,
      note: `${period} · ${rounds} tracked rounds`,
    },
  ];

  return (
    <dl className="mb-10 grid grid-cols-3 divide-x divide-border border-y border-border">
      {items.map((it) => (
        <div key={it.year} className="px-4 py-5 first:pl-0 sm:px-8">
          <dt className="text-micro font-medium uppercase tracking-wider text-muted">{it.year} new capital</dt>
          <dd className="tnum mt-1 font-display text-3xl sm:text-4xl lg:text-5xl">{it.value}</dd>
          <dd className="mt-1 text-micro text-faint">{it.note}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MilestonesSection() {
  return (
    <>
      <HeroStats />
      <MilestoneTimeline />
      <p className="mt-6 max-w-[72ch] text-micro leading-relaxed text-faint">
        Data: Q1+ 2026 BCI Market Map by Neurotech Futures &amp; PL Neuro
        (bit.ly/Q126BCImemo), enriched with primary-source announcement dates.
        Pre-2026 history lands with the Notables/funding-snapshot ingest.
      </p>
    </>
  );
}
