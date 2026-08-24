"use client";

import { PlateHeader } from "@/components/plate-header";
import { SubTabs } from "@/components/sub-tabs";
import { VelocityInstrumentsSection } from "@/components/sections/velocity-instruments-section";
import { ExpectationsSection } from "@/components/sections/expectations-section";

export function VelocityPlate() {
  return (
    <>
      <PlateHeader
        title="Velocity"
        question="Is the field speeding up?"
        status="live"
        description="Five instruments that read a field's pace, plus what forecast markets imply about when its milestones arrive. Where a reading isn't live, it says so."
      />
      <SubTabs
        tabs={[
          { key: "instruments", label: "Instruments", node: <VelocityInstrumentsSection /> },
          { key: "expectations", label: "Expectations", node: <ExpectationsSection /> },
        ]}
      />
    </>
  );
}
