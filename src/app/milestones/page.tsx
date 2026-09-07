import type { Metadata } from "next";
import { PlateHero } from "@/components/plate-header";
import { MilestonesSection } from "@/components/sections/milestones-section";
import MILESTONES from "@/data/milestones.json";

export const metadata: Metadata = { title: "Milestones — Neuro Atlas" };

const years = new Set(MILESTONES.map((row) => (row.date ?? "").slice(0, 4))).size;
const companies = new Set(MILESTONES.map((row) => row.company)).size;

export default function MilestonesPage() {
  return (
    <>
      <PlateHero
        kicker="Field events"
        meta={[`${years} years`]}
        title="Milestones"
        description="Every tracked deal, partnership, first-in-human event, and approval in the implanted-BCI field — on one time axis, year by year."
        status="live"
        stats={[
          { value: String(MILESTONES.length), label: "tracked events" },
          { value: String(companies), label: "companies on the axis" },
          { value: "3", label: "lanes · capital, clinical, commercial" },
          { value: "2024–26", label: "years on the timeline" },
        ]}
      />
      <div className="mt-8">
        <MilestonesSection />
      </div>
    </>
  );
}
