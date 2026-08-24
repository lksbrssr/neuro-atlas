import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { FundingSection } from "@/components/sections/funding-section";

export const metadata: Metadata = { title: "Capital — Neuro Atlas" };

export default function CapitalPage() {
  return (
    <>
      <PlateHeader
        title="Capital"
        question="Where is the money coming from?"
        status="partial"
        description="Implanted-BCI funding flows — the 2026 year-to-date tally and the tracked rounds. Next: the venture / non-dilutive / public / strategic split, and the cumulative funding curve back through 2024."
      />
      <FundingSection />
    </>
  );
}
