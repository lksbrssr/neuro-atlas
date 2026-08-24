import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { Abbr } from "@/components/abbr";

export const metadata: Metadata = { title: "Access — Neuro Atlas" };

export default function AccessPage() {
  return (
    <>
      <PlateHeader
        title="Access"
        question="Does anyone actually get treated?"
        status="planned"
        description="The field's most damning gap: established neurotech therapies reach only a fraction of the patients who need them. This plate tracks whether that changes."
      />

      <div className="card mb-4 p-5">
        <div className="tnum text-3xl font-semibold tracking-tight">3–9%</div>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
          Penetration of established therapies like <Abbr term="DBS" /> and{" "}
          <Abbr term="VNS" /> into their addressable patient populations — held back
          by physician workflow barriers and the legacy risks of traditional surgical
          methods. (PL BCI Roadmap Series, 2026.)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlaceholderPanel
          title="Patients reached vs. addressable"
          description="Per-indication funnel: prevalence → eligible → treated, for DBS, VNS, cochlear implants, and emerging BCI. Blocked on: epidemiology baselines + CMS claims analysis."
          height="h-52"
        />
        <PlaceholderPanel
          title="Reimbursement tracker"
          description="CPT-code events, CMS coverage decisions, and the FDA–CMS gap (TCET / RAPID) per device class — the regulation-reimbursement disconnect, dated. Blocked on: CMS data ETL."
          height="h-52"
        />
      </div>
    </>
  );
}
