import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const metadata: Metadata = { title: "Geopolitics — State of BCI" };

export default function GeopoliticsPage() {
  return (
    <>
      <PlateHeader
        title="Geopolitics"
        question="Where is the field forming?"
        status="partial"
        description="US, China, and Europe compared on capital, trials, approvals, and IP. Live: the Q1 2026 China signal. Next: patent assignee-country split and approvals by regulator."
      />

      <div className="card mb-4 p-5">
        <h2 className="mb-1 text-sm font-semibold">The China signal, Jan–Apr 2026</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="tnum text-2xl font-semibold">$149m+</div>
            <div className="mt-0.5 text-[11px] leading-snug text-muted">
              Chinese BCI investment (StairMed $73m, Axoft $55m, Gestala $21m)
            </div>
          </div>
          <div>
            <div className="tnum text-2xl font-semibold">1st</div>
            <div className="mt-0.5 text-[11px] leading-snug text-muted">
              invasive BCI market approval worldwide (Neuracle, NMPA, Mar 13)
            </div>
          </div>
          <div>
            <div className="tnum text-2xl font-semibold">4+</div>
            <div className="mt-0.5 text-[11px] leading-snug text-muted">
              investor types active: state syndicates, corporates (Alibaba, Tencent), global VC, family offices
            </div>
          </div>
        </div>
        <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted">
          The memo&apos;s read: the trend to monitor is the breadth of investors backing
          China&apos;s BCI push — from regional VC to state-run syndicates and multinational
          corporates across robotics, pharma, e-commerce, and AI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlaceholderPanel
          title="Patent geography"
          description="Median patent vintage and assignee-country split — where neurotech IP is forming. Blocked on: PatentsView / EPO OPS pull (APIs are open)."
          height="h-48"
        />
        <PlaceholderPanel
          title="Approvals & trials by region"
          description="FDA vs. NMPA vs. CE-mark activity, and trial registrations by geography (incl. ChiCTR). Blocked on: registry ETLs; ChiCTR needs Chinese-language scraping."
          height="h-48"
        />
      </div>
    </>
  );
}
