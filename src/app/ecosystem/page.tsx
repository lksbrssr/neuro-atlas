import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { EcosystemExplorer } from "@/components/ecosystem-explorer";
import { CapitalProvidersSection } from "@/components/sections/capital-providers-section";

export const metadata: Metadata = { title: "Ecosystem — Neuro Atlas" };

export default function EcosystemPage() {
  return (
    <>
      <PlateHeader
        title="Ecosystem"
        question="Who is building?"
        status="live"
        description="363 neurotech companies from the Neurofounders start-up map (scraped 2026-08-24), faceted by category, funding stage, country, modality, form factor, interface depth, indication, target user, and regulatory stage. Filter like a shop — the dataset profile recomputes live."
      />
      <EcosystemExplorer />
      <div className="mt-14 border-t border-border pt-10">
        <CapitalProvidersSection />
      </div>
    </>
  );
}
