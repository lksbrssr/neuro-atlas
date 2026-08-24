import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export const metadata: Metadata = { title: "People — State of BCI" };

export default function PeoplePage() {
  return (
    <>
      <PlateHeader
        title="People"
        question="Where is the talent going?"
        status="planned"
        description="Money is one revealed commitment; careers are the other. Almost nobody measures the people side of the field — this plate will."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlaceholderPanel
          title="Talent stock"
          description="Authors publishing in iBCI and adjacent fields over time, from OpenAlex affiliations — the field's headcount proxy. Blocked on: OpenAlex pipeline (API is open; shares plumbing with the idea-vintage instrument)."
          height="h-52"
        />
        <PlaceholderPanel
          title="AI ↔ neuro flows"
          description="Researchers moving between AI labs and computational neuroscience — the 'neural distillation' inflection signal made measurable. Blocked on: affiliation-transition analysis."
          height="h-52"
        />
        <PlaceholderPanel
          title="Founder genealogy"
          description="The Neuralink / BrainGate / Braingate-lab diaspora — which teams spawned which companies. Curated, not scraped. Blocked on: manual curation pass."
          height="h-52"
        />
        <PlaceholderPanel
          title="Field gatherings"
          description="Attendance and program growth at SfN, the BCI Society meeting, and the field's founder retreats — a soft but honest crowd signal. Blocked on: historical attendance data."
          height="h-52"
        />
      </div>
    </>
  );
}
