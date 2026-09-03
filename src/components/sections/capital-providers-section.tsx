import Link from "next/link";
import fundingData from "@/data/funding-index.json";

export function CapitalProvidersSection() {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2.5">
        <h2 className="text-lg font-semibold tracking-tight">Capital providers</h2>
        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
          partial data
        </span>
      </div>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
        Follow the other side of the ledger: which investors appear across a screened set of capitalized BCI companies, and where financing aligns with regulatory progress.
      </p>
      <Link href="/funding" className="card group block overflow-hidden p-5 transition-transform hover:-translate-y-0.5 sm:p-6">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">BCI Funding Index · V1</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">Open the financing and investor plate</h3>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
              Timeline and stage views, company detail drawers, named investor participation, and BDD / TAP / IDE / Pivotal / CE / NMPA markers.
            </p>
          </div>
          <div className="flex items-end gap-6">
            <div><div className="tnum text-2xl font-semibold">{fundingData.summary.selectedCompanies}</div><div className="text-[10px] text-faint">companies</div></div>
            <div><div className="tnum text-2xl font-semibold">{fundingData.summary.indexedRounds}</div><div className="text-[10px] text-faint">financings</div></div>
            <span className="pb-1 text-faint transition-transform group-hover:translate-x-1">→</span>
          </div>
        </div>
      </Link>
    </section>
  );
}
