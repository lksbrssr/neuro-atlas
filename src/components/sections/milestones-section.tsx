import { SectionIntro } from "@/components/sections/section-intro";
import { MilestoneTimeline } from "@/components/milestone-timeline";

export function MilestonesSection() {
  return (
    <>
      <SectionIntro title="2026 milestone timeline">
        Every tracked deal, partnership, first-in-human event, and approval in the
        implanted-BCI field, Jan–Apr 2026, on one shared time axis — color marks the
        stage. Click a stage in the legend to expand its subcategories and filter by
        any subset; hover any logo for details; click to open the primary source.
        Undated events sit in the &apos;date TBD&apos; shelf rather than being faked
        onto the axis.
      </SectionIntro>
      <MilestoneTimeline />
      <p className="mt-4 text-xs leading-relaxed text-faint">
        Data: Q1+ 2026 BCI Market Map by Neurotech Futures &amp; PL Neuro
        (bit.ly/Q126BCImemo), enriched with primary-source announcement dates.
        Pre-2026 history lands with the Notables/funding-snapshot ingest.
      </p>
    </>
  );
}
