import { SectionIntro } from "@/components/sections/section-intro";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { FirmLogo } from "@/components/firm-logo";
import { BarList } from "@/components/bar-list";
import CAPITAL from "@/data/capital.json";
import MILESTONES from "@/data/milestones.json";

export function FundingSection() {
  const deals = MILESTONES.filter((m) => m.stage === "capital" && m.amountUsdM).sort(
    (a, b) => (b.amountUsdM ?? 0) - (a.amountUsdM ?? 0),
  );
  return (
    <>
      <SectionIntro title="Funding flows">
        Implanted-BCI capital. Live: the 2026 year-to-date tally and deal list from the
        Q1+ market memo. Next: the venture / non-dilutive / public / strategic split,
        and the cumulative funding curve back through 2024.
      </SectionIntro>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-1 text-sm font-semibold">New capital by year</h3>
          <p className="mb-4 text-[11px] text-faint">USD millions · 2026 is Jan–Apr only</p>
          <BarList
            items={CAPITAL.map((c) => ({
              label: String(c.year),
              value: c.usdM,
              hint: c.note.includes("Jan") ? c.note : undefined,
            }))}
            unit="m"
          />
          <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted">
            At the Jan–Apr pace, 2026 implanted-BCI funding lands around $2b —
            45% of 2025&apos;s full-year total was already in by end of April.
          </p>
        </div>

        <div className="card p-5">
          <h3 className="mb-1 text-sm font-semibold">2026 rounds tracked</h3>
          <p className="mb-4 text-[11px] text-faint">Jan–Apr 2026 · disclosed amounts</p>
          <ul className="space-y-2.5">
            {deals.map((d) => (
              <li key={`${d.company}-${d.activity}`}>
                <a
                  href={d.sourceUrl ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5"
                >
                  <FirmLogo src={d.logo} name={d.company} size={20} />
                  <span className="truncate text-[13px]">{d.company}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-faint">
                    {d.date ?? "date TBD"}
                  </span>
                  <span className="tnum w-16 shrink-0 text-right text-[13px] font-semibold">
                    {d.activity}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlaceholderPanel
          title="Venture vs. non-dilutive"
          description="The split between venture rounds and grants / public money (NIH RePORTER, ARPA-H, CORDIS pulls). Blocked on: grants-pipeline ingest — the APIs are open, the ETL isn't built yet."
          height="h-48"
        />
        <PlaceholderPanel
          title="Cumulative funding curve"
          description="Quarterly BCI funding back through 2024, from the Neurotech Futures deal ledger. Blocked on: underlying deal sheet (partnership channel) or a Notables #46–#59 scrape."
          height="h-48"
        />
      </div>
    </>
  );
}
