import type { Metadata } from "next";
import { PlateHero } from "@/components/plate-header";
import { VelocityTabs } from "@/components/sections/velocity-tabs";
import INSTRUMENTS from "@/data/velocity/instruments.json";
import RECORDS from "@/data/velocity/neurotech_records.json";
import POINTS from "@/data/velocity/neurotech_inflection_points.json";

export const metadata: Metadata = { title: "Field velocity — Neuro Atlas" };

const live = RECORDS.records.filter((row) => row.state === "reading").length;
const unwired = RECORDS.records.filter((row) => row.state === "unwired").length;

export default function FieldVelocityPage() {
  return (
    <>
      <PlateHero
        kicker="Pace"
        meta={["PL R&D instruments"]}
        title="Field velocity"
        description="Instruments that read a field's underlying pace, plus what forecast markets imply about what's next. Where a reading is live it carries a date and a source; where it isn't, we name the metric and what's blocking it."
        status="live"
        stats={[
          { value: String(INSTRUMENTS.instruments.length), label: "instruments" },
          { value: String(live), label: "live readings" },
          { value: String(unwired), label: "named, still unwired" },
          { value: String(POINTS.points.length), label: "inflection points" },
        ]}
      />
      <div className="mt-8">
        <VelocityTabs />
      </div>
    </>
  );
}
