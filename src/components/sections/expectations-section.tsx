import { SectionIntro } from "@/components/sections/section-intro";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import MARKETS from "@/data/velocity/neurotech_market_signals.json";

const PLATFORM_LABEL: Record<string, string> = {
  kalshi: "Kalshi",
  polymarket: "Polymarket",
  metaculus: "Metaculus",
};

export function ExpectationsSection() {
  return (
    <>
      <SectionIntro title="Expectations">
        Forecast markets mapped to the field&apos;s inflection points — what the crowd
        implies about when BCI milestones arrive. Live: the mapped questions. Next: live
        prices via the platform APIs, and a term structure across horizons.
      </SectionIntro>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MARKETS.mappings.map((m) => (
          <div key={m.title} className="card flex flex-col p-5">
            <h3 className="text-sm font-semibold tracking-tight">{m.title}</h3>
            {m.match === "proxy" && m.primary ? (
              <>
                <a
                  href={m.primary.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 text-[13px] font-medium text-accent hover:underline"
                >
                  {PLATFORM_LABEL[m.primary.platform] ?? m.primary.platform}: “{m.primary.question}” ↗
                </a>
                {"fallback" in m && m.fallback && (
                  <a
                    href={m.fallback.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 text-[12px] text-muted hover:underline"
                  >
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
            <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted">{m.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <PlaceholderPanel
          title="Term structure"
          description="The same milestone asked at several horizons — a yield curve for the field, where an earlier implied date means expected acceleration. Blocked on: aggregation across the platform APIs."
          height="h-40"
        />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-faint">
        Read with care: markets can be thin, questions can resolve ambiguously, and
        attention work can move the very markets being read.
      </p>
    </>
  );
}
