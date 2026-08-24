import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { FirmLogo } from "@/components/firm-logo";
import MILESTONES from "@/data/milestones.json";

export const metadata: Metadata = { title: "Pipeline — State of BCI" };

export default function PipelinePage() {
  const clinical = MILESTONES.filter((m) => m.stage === "clinical");
  return (
    <>
      <PlateHeader
        title="Clinical pipeline"
        question="How fast is the clinic moving?"
        status="partial"
        description="Trials, first-in-human events, and the regulatory clock from IDE to approval. Live: the 2026 clinical-event cluster. Next: the full trial registry by phase and indication (ClinicalTrials.gov), and per-company IDE→FIH→pivotal elapsed times."
      />

      <div className="card mb-4 p-5">
        <h2 className="mb-1 text-sm font-semibold">The 2026 clinical cluster</h2>
        <p className="mb-4 text-[11px] text-faint">
          First-in-human implants, breakthrough designations, and trial starts tracked Jan–Apr 2026
        </p>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {clinical.map((m) => (
            <li key={`${m.company}-${m.activity}`}>
              <a
                href={m.sourceUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5"
              >
                <FirmLogo src={m.logo} name={m.company} size={20} />
                <span className="truncate text-[13px]">{m.company}</span>
                <span className="ml-auto shrink-0 text-[11px] text-faint">{m.date ?? "2026"}</span>
                <span className="tnum shrink-0 rounded-full bg-negative-soft px-2 py-0.5 text-[11px] font-semibold text-negative">
                  {m.activity}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlaceholderPanel
          title="Trials by phase & indication"
          description="Active BCI and neurotech trials from ClinicalTrials.gov, sliced by phase, indication, and modality. Blocked on: registry ETL (API is open)."
          height="h-48"
        />
        <PlaceholderPanel
          title="The regulatory clock"
          description="Elapsed time per company from IDE to first implant to pivotal to approval — the latency-compression instrument made concrete. Blocked on: enough completed transitions to trend."
          height="h-48"
        />
      </div>
    </>
  );
}
