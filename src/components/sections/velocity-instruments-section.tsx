import { Sparkline, GhostChart } from "@/components/sparkline";
import INSTRUMENTS from "@/data/velocity/instruments.json";
import RECORDS from "@/data/velocity/neurotech_records.json";

const DEFS = Object.fromEntries(INSTRUMENTS.instruments.map((i) => [i.id, i]));

type Workbench = { title: string; pick?: boolean; target: string; build: string; pitch: string };
const WORKBENCH: Workbench[] = [
  {
    title: "The Implant Ledger",
    pick: true,
    target: "10,000 implants",
    build: "Manual curation · ~40 records · quarterly",
    pitch:
      "The field's two public counts disagree by 2× — Neurofounders says roughly 50 commercial, bciintel says ~107 — and almost the entire gap is Precision's ~100 intraoperative array placements, which one counts as chronic and the other excludes. Nobody has published a taxonomy. A ledger separating chronic / acute-intraoperative / temporary-percutaneous / enrolled-not-implanted, by company and country, resolves a live public dispute on the first day it ships.",
  },
  {
    title: "Open Neural Data Hours",
    pick: true,
    target: "100M hours",
    build: "Days of engineering, then automated",
    pitch:
      "No archive publishes recording-hours, but it's derivable — NWB session metadata in DANDI (1,159 dandisets, 2.2 PB) carries start/stop times and sampling rates, and the API exposes asset metadata without downloading data. Add IBL, Allen, DABI, OpenNeuro. This would be the first public estimate of how much open neural data exists, in the unit your own milestone is denominated in.",
  },
  {
    title: "The Channel-Count Frontier",
    target: "OS1 device capability",
    build: "Manual literature build, then low-touch",
    pitch:
      "Maximum simultaneously recorded channels in a human, over time. This is neurotech's Moore's-law chart and it does not exist. Visually it's the single most compelling asset in the whole hub, and it maps directly onto the OS1 bottleneck you named — device capability. Assembled from published trials and company disclosures.",
  },
];

const ROW = "grid gap-5 rounded-xl px-5 py-5 md:grid-cols-[1fr_340px] md:items-center";
const zebra = (i: number) => (i % 2 === 1 ? "bg-black/[0.025] dark:bg-white/[0.03]" : "");

export function VelocityInstrumentsSection() {
  let i = 0;
  return (
    <>
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted">
        Instruments that read the field&apos;s underlying pace. Where a reading is live it
        carries a date, a source, and a chart you can drag to measure; where it isn&apos;t,
        we name the metric we intend to use and what is blocking it — an honest
        &apos;unwired&apos; is a correct answer.
      </p>

      <div className="flex flex-col gap-1">
        {RECORDS.records.map((r) => {
          const def = DEFS[r.instrument];
          const isReading = r.state === "reading";
          return (
            <div key={r.instrument} className={`${ROW} ${zebra(i++)}`}>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">{def.label}</h3>
                  {isReading
                    ? r.direction && (
                        <span className="rounded-full bg-positive-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-positive">
                          {r.direction}
                        </span>
                      )
                    : (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-faint">
                        not yet wired
                      </span>
                    )}
                </div>
                <p className="mb-2 text-[11px] text-faint">{def.subtitle}</p>

                {isReading ? (
                  <>
                    <p className="text-[13px] font-medium leading-snug">{r.metric}</p>
                    <p className="tnum mt-0.5 text-xl font-semibold tracking-tight">{r.value}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{r.trend}</p>
                    {r.sources && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {r.sources.map((s) => (
                          <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-[11px] text-accent hover:underline">
                            {s.label} ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-[13px] leading-snug">
                      <span className="font-medium">Candidate metric:</span>{" "}
                      <span className="text-muted">{r.candidateMetric}</span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-faint">
                      Blocked by: {r.blocker}
                      {"owner" in r && r.owner ? ` · owner: ${r.owner}` : ""}
                    </p>
                  </>
                )}
              </div>

              <div className="flex justify-center md:justify-end">
                {isReading && r.series ? (
                  <div>
                    <Sparkline series={r.series} scale={(r.seriesScale as "linear" | "log") ?? "linear"} width={340} height={96} axis interactive />
                    <p className="mt-1 text-[10px] text-faint">
                      {r.seriesScale === "log" ? "log scale · " : ""}
                      {r.window} · drag across the curve to measure a change
                    </p>
                  </div>
                ) : isReading && r.instrument === "revealed_commitments" ? (
                  <div className="w-full max-w-[340px]">
                    <div className="mb-1 flex items-baseline justify-between text-[11px] text-muted">
                      <span>67 implanted</span>
                      <span className="tnum">milestone: 10,000 by 2030</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border/60">
                      <div className="h-full rounded-full bg-accent" style={{ width: "0.7%", minWidth: 4 }} />
                    </div>
                    <p className="mt-1 text-[10px] text-faint">~150× below the milestone — no year-by-year series wired yet</p>
                  </div>
                ) : (
                  <GhostChart width={220} height={60} />
                )}
              </div>
            </div>
          );
        })}

        {WORKBENCH.map((w) => (
          <div key={w.title} className={`${ROW} ${zebra(i++)}`}>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight">{w.title}</h3>
                {w.pick && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">v1 pick</span>
                )}
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-faint">coming soon</span>
              </div>
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                <span className="text-faint">Feeds <span className="font-medium text-muted">{w.target}</span></span>
                <span className="text-faint">Build <span className="font-medium text-muted">{w.build}</span></span>
              </div>
              <p className="text-xs leading-relaxed text-muted">{w.pitch}</p>
            </div>
            <div className="flex justify-center md:justify-end">
              <GhostChart width={220} height={60} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-faint">
        Instruments and readings inherited from PL R&amp;D&apos;s field-velocity framework
        (plrd.org). Idea-vintage and latency pipelines land next.
      </p>
    </>
  );
}
