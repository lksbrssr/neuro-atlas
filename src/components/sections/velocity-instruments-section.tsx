import { SectionIntro } from "@/components/sections/section-intro";
import { Sparkline, GhostChart } from "@/components/sparkline";
import INSTRUMENTS from "@/data/velocity/instruments.json";
import RECORDS from "@/data/velocity/neurotech_records.json";
import POINTS from "@/data/velocity/neurotech_inflection_points.json";
import MARKETS from "@/data/velocity/neurotech_market_signals.json";

const DEFS = Object.fromEntries(INSTRUMENTS.instruments.map((i) => [i.id, i]));
const MARKET_BY_TITLE = Object.fromEntries(MARKETS.mappings.map((m) => [m.title, m]));

export function VelocityInstrumentsSection() {
  return (
    <>
      <SectionIntro title="Five instruments">
        Read honestly: where a reading is live it carries a date, a source, and a chart
        you can drag to measure. Where it is not, we name the metric we intend to use
        and what is blocking it — an honest &apos;unwired&apos; is a correct answer.
      </SectionIntro>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {RECORDS.records.map((r) => {
          const def = DEFS[r.instrument];
          const isReading = r.state === "reading";
          return (
            <div key={r.instrument} className="card flex flex-col p-5">
              <div className="mb-1 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold tracking-tight">{def.label}</h3>
                {isReading ? (
                  r.direction && (
                    <span className="rounded-full bg-positive-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-positive">
                      {r.direction}
                    </span>
                  )
                ) : (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-faint">
                    not yet wired
                  </span>
                )}
              </div>
              <p className="mb-4 text-[11px] text-faint">{def.subtitle}</p>

              {isReading ? (
                <>
                  <p className="text-[13px] font-medium leading-snug">{r.metric}</p>
                  <p className="tnum mt-1 text-xl font-semibold tracking-tight">{r.value}</p>
                  {r.series ? (
                    <div className="mt-3">
                      <Sparkline
                        series={r.series}
                        scale={(r.seriesScale as "linear" | "log") ?? "linear"}
                        width={420}
                        height={110}
                        axis
                        interactive
                      />
                      <p className="mt-1 text-[10px] text-faint">
                        {r.seriesScale === "log" ? "log scale · " : ""}
                        {r.window} · drag across the curve to measure a change
                      </p>
                    </div>
                  ) : (
                    r.instrument === "revealed_commitments" && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-baseline justify-between text-[11px] text-muted">
                          <span>67 implanted</span>
                          <span className="tnum">milestone: 10,000 by 2030</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-border/60">
                          <div className="h-full rounded-full bg-accent" style={{ width: "0.7%", minWidth: 4 }} />
                        </div>
                        <p className="mt-1 text-[10px] text-faint">~150× below the milestone — no year-by-year series wired yet</p>
                      </div>
                    )
                  )}
                  <p className="mt-3 text-xs leading-relaxed text-muted">{r.trend}</p>
                  {r.sources && (
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3">
                      {r.sources.map((s) => (
                        <a
                          key={s.url}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-accent hover:underline"
                        >
                          {s.label} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-3 flex justify-center py-2">
                    <GhostChart width={200} height={48} />
                  </div>
                  <p className="text-[13px] leading-snug">
                    <span className="font-medium">Candidate metric:</span>{" "}
                    <span className="text-muted">{r.candidateMetric}</span>
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-faint">
                    Blocked by: {r.blocker}
                    {"owner" in r && r.owner ? ` · owner: ${r.owner}` : ""}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </section>

      <section className="mt-10">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
          Inflection points we&apos;re tracking
        </h3>
        <p className="mb-4 max-w-2xl text-xs leading-relaxed text-faint">
          {INSTRUMENTS.inflectionExplainer.description}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {POINTS.points.map((p) => {
            const mkt = MARKET_BY_TITLE[p.title];
            return (
              <div key={p.title} className="card flex flex-col p-5">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-accent">
                  {p.opportunitySpace}
                </p>
                <h4 className="text-sm font-semibold tracking-tight">{p.title}</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  <span className="font-medium text-foreground">Signal: </span>
                  {p.signal}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  <span className="font-medium text-foreground">Cascade: </span>
                  {p.cascade}
                </p>
                <div className="mt-3 border-t border-border pt-3 text-[11px]">
                  {mkt?.match === "proxy" && mkt.primary ? (
                    <a href={mkt.primary.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      {mkt.primary.platform}: “{mkt.primary.question}” ↗
                    </a>
                  ) : (
                    <span className="italic text-faint">No live market prices this yet — white space.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-faint">
        Instruments and readings inherited from PL R&amp;D&apos;s field-velocity framework
        (plrd.org). Idea-vintage and latency pipelines land next.
      </p>
    </>
  );
}
