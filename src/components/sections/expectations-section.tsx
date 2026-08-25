import MARKETS from "@/data/velocity/neurotech_market_signals.json";

const PLATFORM_LABEL: Record<string, string> = {
  kalshi: "Kalshi",
  polymarket: "Polymarket",
  metaculus: "Metaculus",
};

const zebra = (i: number) => (i % 2 === 1 ? "bg-black/[0.025] dark:bg-white/[0.03]" : "");

export function ExpectationsSection() {
  return (
    <>
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted">
        Forecast markets mapped to the field&apos;s inflection points — what the crowd
        implies about when BCI milestones arrive. Live: the mapped questions. Next: live
        prices via the platform APIs, and a term structure across horizons.
      </p>

      <div className="flex flex-col gap-1">
        {MARKETS.mappings.map((m, i) => (
          <div key={m.title} className={`rounded-xl px-5 py-4 ${zebra(i)}`}>
            <div className="grid gap-4 md:grid-cols-[1fr_1fr] md:items-start">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">{m.title}</h3>
                {m.match === "proxy" && m.primary ? (
                  <>
                    <a href={m.primary.url} target="_blank" rel="noreferrer" className="mt-2 block text-[13px] font-medium text-accent hover:underline">
                      {PLATFORM_LABEL[m.primary.platform] ?? m.primary.platform}: “{m.primary.question}” ↗
                    </a>
                    {"fallback" in m && m.fallback && (
                      <a href={m.fallback.url} target="_blank" rel="noreferrer" className="mt-1 block text-[12px] text-muted hover:underline">
                        Fallback — {PLATFORM_LABEL[m.fallback.platform] ?? m.fallback.platform}: “{m.fallback.question}” ↗
                      </a>
                    )}
                    <span className="mt-2 inline-flex w-fit rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                      live price coming soon
                    </span>
                  </>
                ) : (
                  <span className="mt-2 inline-flex w-fit rounded-full border border-dashed border-border-strong px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-faint">
                    white space — no market prices this
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted md:pt-1">{m.note}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-faint">
        Read with care: markets can be thin, questions can resolve ambiguously, and
        attention work can move the very markets being read.
      </p>
    </>
  );
}
