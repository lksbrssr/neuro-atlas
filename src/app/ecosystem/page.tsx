import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { EcosystemExplorer } from "@/components/ecosystem-explorer";

export const metadata: Metadata = { title: "Ecosystem — Neuro Atlas" };

export default function EcosystemPage() {
  return (
    <>
      <PlateHeader
        title="Ecosystem"
        question="Who is building?"
        status="live"
        description="363 neurotech companies from the Neurofounders start-up map (scraped 2026-08-24). Filter with the facet pills, then watch the companies slot into bubble-clusters by category, country, modality, or funding stage."
      />
      <EcosystemExplorer />
    </>
  );
}
