"use client";

import { SubTabs } from "@/components/sub-tabs";
import { VelocityInstrumentsSection } from "@/components/sections/velocity-instruments-section";
import { ExpectationsSection } from "@/components/sections/expectations-section";

export function VelocityTabs() {
  return (
    <SubTabs
      tabs={[
        { key: "instruments", label: "Instruments", node: <VelocityInstrumentsSection /> },
        { key: "expectations", label: "Expectations", node: <ExpectationsSection /> },
      ]}
    />
  );
}
