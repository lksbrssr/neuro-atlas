import { SectionIntro } from "@/components/sections/section-intro";
import { LandscapeExplorer } from "@/components/landscape-explorer";

export function LandscapeSection() {
  return (
    <>
      <SectionIntro title="Company landscape">
        363 neurotech companies from the Neurofounders start-up map (scraped
        2026-08-24), faceted by category, funding stage, country, modality, interface
        depth, and regulatory stage. Filter like a shop — the dataset profile
        recomputes live.
      </SectionIntro>
      <LandscapeExplorer />
    </>
  );
}
