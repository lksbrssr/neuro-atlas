import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { VelocityInstrumentsSection } from "@/components/sections/velocity-instruments-section";
import { VelocityWorkbenchSection } from "@/components/sections/velocity-workbench-section";
import { ExpectationsSection } from "@/components/sections/expectations-section";

export const metadata: Metadata = { title: "Field velocity — Neuro Atlas" };

export default function FieldVelocityPage() {
  return (
    <>
      <PlateHeader
        title="Field velocity"
        question="Is the field speeding up?"
        status="live"
        description="Instruments that read a field's underlying pace, plus what forecast markets imply about what's next. Where a reading is live it carries a date and a source; where it isn't, we name the metric and what's blocking it."
      />
      <VelocityInstrumentsSection />
      <div className="mt-14 border-t border-border pt-10">
        <VelocityWorkbenchSection />
      </div>
      <div className="mt-14 border-t border-border pt-10">
        <ExpectationsSection />
      </div>
    </>
  );
}
