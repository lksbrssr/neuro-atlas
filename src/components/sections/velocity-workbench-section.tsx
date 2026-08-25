import { SectionIntro } from "@/components/sections/section-intro";
import { GhostChart } from "@/components/sparkline";

type Workbench = {
  title: string;
  pick?: boolean;
  target: string;
  build: string;
  pitch: string;
};

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

export function VelocityWorkbenchSection() {
  return (
    <>
      <SectionIntro title="On the workbench">
        Instruments we&apos;ve scoped but not yet shipped — each one closes a specific,
        checkable gap in the public record. Marked honestly as coming soon, with the
        milestone it feeds and the build it needs.
      </SectionIntro>

      <div className="grid grid-cols-1 gap-x-10 gap-y-9 lg:grid-cols-2">
        {WORKBENCH.map((w) => (
          <div key={w.title} className="flex flex-col">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight">{w.title}</h3>
              {w.pick && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  v1 pick
                </span>
              )}
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-faint">
                coming soon
              </span>
            </div>

            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              <span className="text-faint">
                Feeds <span className="font-medium text-muted">{w.target}</span>
              </span>
              <span className="text-faint">
                Build <span className="font-medium text-muted">{w.build}</span>
              </span>
            </div>

            <div className="mb-3 flex justify-center py-1">
              <GhostChart width={200} height={44} />
            </div>

            <p className="text-xs leading-relaxed text-muted">{w.pitch}</p>
          </div>
        ))}
      </div>
    </>
  );
}
