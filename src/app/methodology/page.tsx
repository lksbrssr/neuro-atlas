import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { Abbr } from "@/components/abbr";

export const metadata: Metadata = { title: "Methodology — State of BCI" };

const SOURCES = [
  {
    name: "Neurofounders start-up map",
    what: "363 neurotech companies: category, stage, country, modality, interface depth, regulatory stage.",
    cadence: "Scraped 2026-08-24 · re-scrape on demand",
    url: "https://www.neurofounders.co/resources/start-up-map",
  },
  {
    name: "Q1+ 2026 BCI Market Memo",
    what: "Milestones, deals, and ecosystem firms, Jan–Apr 2026. By Neurotech Futures & PL Neuro; enriched here with primary-source dates.",
    cadence: "Point-in-time (Apr 2026)",
    url: "https://neurotechnology.substack.com/p/representations2",
  },
  {
    name: "PL R&D field-velocity framework",
    what: "The five velocity instruments, neurotech readings, inflection points, and forecast-market mappings.",
    cadence: "Inherited from plrd.org · per-reading measuredAt/checkedAt",
    url: "https://www.plrd.org/",
  },
  {
    name: "Forecast markets",
    what: "Kalshi, Polymarket, Metaculus questions mapped to inflection points.",
    cadence: "Live pulls coming soon",
    url: null,
  },
];

const PRINCIPLES = [
  {
    title: "Never fabricate a reading",
    body: "Every metric is live, or it is honestly marked unwired (a named candidate metric plus its blocker) or not applicable (a reason). Dates without confirmation sit in a 'date TBD' shelf instead of being faked onto an axis.",
  },
  {
    title: "Measurement with a feed underneath",
    body: "Every plate is a measurement whose drill-down is its evidence: the deal table under Capital, the event sources under Milestones, the article stream under future plates. The feed is the footnote apparatus, never the product.",
  },
  {
    title: "Every reading carries provenance",
    body: "Sources, observation date (measuredAt) and pipeline-run date (checkedAt) travel with each number. Queries behind derived series get frozen and versioned — a changed query is a new series, not a silent update.",
  },
  {
    title: "Acronyms get tooltips",
    body: "Any acronym from the glossary rendered in this UI carries its expansion and a one-line definition on hover — like FIH, BDD, or IDE. The glossary is a data file, not hardcoded strings.",
  },
];

export default function MethodologyPage() {
  return (
    <>
      <PlateHeader
        title="Methodology"
        question="How this is built"
        status="live"
        description="What each reading means, where the data comes from, and how to contribute. The methodology is versioned: when a method changes, the change is logged here."
      />

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Principles</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="card p-5">
              <h3 className="text-sm font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {p.title === "Acronyms get tooltips" ? (
                  <>
                    Any acronym from the glossary rendered in this UI carries its expansion
                    and a one-line definition on hover — like <Abbr term="FIH" />,{" "}
                    <Abbr term="BDD" />, or <Abbr term="IDE" />. The glossary is a data
                    file, not hardcoded strings.
                  </>
                ) : (
                  p.body
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Data sources</h2>
        <div className="card divide-y divide-border">
          {SOURCES.map((s) => (
            <div key={s.name} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-4">
              <div className="w-56 shrink-0 text-[13px] font-semibold">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                    {s.name} ↗
                  </a>
                ) : (
                  s.name
                )}
              </div>
              <div className="flex-1 text-xs leading-relaxed text-muted">{s.what}</div>
              <div className="shrink-0 text-[11px] text-faint">{s.cadence}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Status legend</h2>
        <div className="card flex flex-wrap gap-x-8 gap-y-3 p-5 text-xs text-muted">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-positive" /> Live — real data, sourced and dated
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning" /> Partial — some readings live, gaps named
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full border border-border-strong" /> Coming soon — metric named, pipeline not built
          </span>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Contribute</h2>
        <div className="card p-5">
          <p className="text-sm leading-relaxed text-muted">
            This atlas is built in the open. The data layer is CSV and JSON with
            provenance fields —{" "}
            <a
              href="https://github.com/lksbrssr/bci-dashboard"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent hover:underline"
            >
              open an issue with a source, or PR a row
            </a>
            . Corrections with a primary source beat opinions; a dated number with a
            link beats both.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Changelog</h2>
        <div className="card p-5">
          <ul className="space-y-2 text-xs leading-relaxed text-muted">
            <li>
              <span className="tnum font-medium text-foreground">2026-08-24</span> — v0.2:
              plates introduced; milestone Zeitstrahl (Jan–Apr 2026), faceted landscape
              explorer, velocity instruments, capital partials. Announcement dates
              added to 10 of 28 milestone rows from primary sources.
            </li>
            <li>
              <span className="tnum font-medium text-foreground">2026-08-24</span> — v0.1:
              shell, theming, data ingest (Neurofounders, market memo, field velocity).
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
