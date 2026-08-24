import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { MilestoneTimeline } from "@/components/milestone-timeline";

export const metadata: Metadata = { title: "Milestones — State of BCI" };

export default function MilestonesPage() {
  return (
    <>
      <PlateHeader
        title="2026 milestone timeline"
        question="What just happened?"
        status="live"
        description="Every tracked deal, partnership, first-in-human event, and approval in the implanted-BCI field, Jan–Apr 2026, on one time axis. Toggle the stage lanes, hover any event for details, click to open the primary source. Events without a confirmed date sit in the 'date TBD' shelf rather than being faked onto the axis."
      />
      <MilestoneTimeline />
      <p className="mt-4 text-xs leading-relaxed text-faint">
        Data: Q1+ 2026 BCI Market Map by Neurotech Futures &amp; PL Neuro
        (bit.ly/Q126BCImemo), enriched with primary-source announcement dates.
        Pre-2026 history lands with the Notables/funding-snapshot ingest.
      </p>
    </>
  );
}
