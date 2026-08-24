"use client";

import { PlateHeader } from "@/components/plate-header";
import { SubTabs } from "@/components/sub-tabs";
import { MilestonesSection } from "@/components/sections/milestones-section";
import { LandscapeSection } from "@/components/sections/landscape-section";
import { FundingSection } from "@/components/sections/funding-section";

export function CapitalPlate() {
  return (
    <>
      <PlateHeader
        title="Capital"
        question="The money & market view"
        status="partial"
        description="What just happened, who's building, and where the money is flowing — the milestone timeline, the company landscape, and implanted-BCI funding, in one plate."
      />
      <SubTabs
        tabs={[
          { key: "milestones", label: "Milestones", node: <MilestonesSection /> },
          { key: "landscape", label: "Landscape", node: <LandscapeSection /> },
          { key: "funding", label: "Funding", node: <FundingSection /> },
        ]}
      />
    </>
  );
}
