import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { MilestonesSection } from "@/components/sections/milestones-section";

export const metadata: Metadata = { title: "Milestones — Neuro Atlas" };

export default function MilestonesPage() {
  return (
    <>
      <PlateHeader
        title="Milestones"
        question="What just happened?"
        status="live"
        description="Every tracked deal, partnership, first-in-human event, and approval in the implanted-BCI field in 2026 — on one time axis."
      />
      <MilestonesSection />
    </>
  );
}
