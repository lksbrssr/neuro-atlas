import { Sparkline, GhostChart } from "@/components/sparkline";
import INSTRUMENTS from "@/data/velocity/instruments.json";
import RECORDS from "@/data/velocity/neurotech_records.json";

const DEFS = Object.fromEntries(INSTRUMENTS.instruments.map((i) => [i.id, i]));

export function VelocityInstrumentsSection({ performance }: { performance: React.ReactNode }) {
  return (
    <>
      {performance}
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted">
        Other metrics that read the field&apos;s underlying pace. These earlier Atlas extracts
        remain separate from the shared performance, Idea vintage and Latency compression snapshot above. Where a reading exists,
        it carries a source and a chart you can drag to measure; where it doesn&apos;t,
        we name the metric we intend to use and what is blocking it — an honest
        &apos;unwired&apos; is a correct answer.
      </p>

      <div className="flex flex-col gap-1">
        {RECORDS.records.filter(r => !["performance_curves", "idea_vintage", "latency_compression"].includes(r.instrument)).map((r) => {
          const def = DEFS[r.instrument];
          const isReading = r.state === "reading";
          return (
            <section key={r.instrument} id={r.instrument} className="performance-curves" aria-labelledby={`${r.instrument}-title`}>
              <header className="pc-section-header"><h2 id={`${r.instrument}-title`}>{def.label}</h2></header>
              <p className="pc-intro">{def.subtitle}</p>
              <div className="pc-grid">
                <article className="pc-card card p-5">
                  <div className="mb-3 flex items-center gap-2">
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

                  <div className="pc-legacy-chart mt-5">
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
                </article>
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-faint">
        Instruments and readings inherited from PL R&amp;D&apos;s field-velocity framework
        (plrd.org). The Channel count frontier preview is not an implemented metric.
      </p>
    </>
  );
}
