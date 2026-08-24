import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { LandscapeExplorer } from "@/components/landscape-explorer";

export const metadata: Metadata = { title: "Landscape — State of BCI" };

export default function LandscapePage() {
  return (
    <>
      <PlateHeader
        title="Company landscape"
        question="Who is building?"
        status="live"
        description="363 neurotech companies from the Neurofounders start-up map (scraped 2026-08-24), faceted by category, funding stage, country, modality, interface depth, and regulatory stage. Filter like a shop — the dataset profile recomputes live."
      />
      <LandscapeExplorer />
    </>
  );
}
