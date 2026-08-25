import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { VelocityInstrumentsSection } from "@/components/sections/velocity-instruments-section";

export const metadata: Metadata = { title: "Field velocity — Neuro Atlas" };

export default function FieldVelocityPage() {
  return (
    <>
      <PlateHeader
        title="Field velocity"
        question="Is the field speeding up?"
        status="live"
        description="Five instruments that read a field's underlying pace. Where a reading is live it carries a date and a source; where it isn't, we name the metric and what's blocking it."
      />
      <VelocityInstrumentsSection />
    </>
  );
}
