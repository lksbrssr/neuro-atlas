"use client";

import { PlateHeader } from "@/components/plate-header";
import { SubTabs } from "@/components/sub-tabs";
import { MilestonesSection } from "@/components/sections/milestones-section";
import { ExpectationsSection } from "@/components/sections/expectations-section";
import { VelocityInstrumentsSection } from "@/components/sections/velocity-instruments-section";

export function ProgressPlate() {
  return (
    <>
      <PlateHeader
        title="Progress"
        question="Is the field moving — and how fast?"
        status="live"
        description="What just happened, what the crowd expects next, and the instruments that read the field's underlying pace."
      />
      <SubTabs
        tabs={[
          {
            key: "milestones",
            label: "Milestones",
            node: (
              <>
                <MilestonesSection />
                <div className="mt-14 border-t border-border pt-10">
                  <ExpectationsSection />
                </div>
              </>
            ),
          },
          {
            key: "field-performance",
            label: "Field performance",
            node: <VelocityInstrumentsSection />,
          },
        ]}
      />
    </>
  );
}
