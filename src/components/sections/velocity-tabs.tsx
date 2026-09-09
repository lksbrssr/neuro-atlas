"use client";

import { SubTabs } from "@/components/sub-tabs";
import { VelocityInstrumentsSection } from "@/components/sections/velocity-instruments-section";
import { ExpectationsSection } from "@/components/sections/expectations-section";
import { usePerformanceHash, navigatePerformance } from "@/lib/field-velocity/navigation";

export function VelocityTabs({ performance }: { performance: React.ReactNode }) {
  const hash = usePerformanceHash();
  return (
    <SubTabs
      selectedKey={hash === "#expectations" ? "expectations" : "instruments"}
      onSelect={key => navigatePerformance(key === "expectations" ? "expectations" : "performance_curves")}
      tabs={[
        { key: "instruments", label: "Metrics", node: <VelocityInstrumentsSection performance={performance} /> },
        { key: "expectations", label: "Expectations", node: <ExpectationsSection /> },
      ]}
    />
  );
}
