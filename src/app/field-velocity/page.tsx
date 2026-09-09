import type { Metadata } from "next";
import { PlateHero } from "@/components/plate-header";
import { VelocityTabs } from "@/components/sections/velocity-tabs";
import INSTRUMENTS from "@/data/velocity/instruments.json";
import RECORDS from "@/data/velocity/neurotech_records.json";
import POINTS from "@/data/velocity/neurotech_inflection_points.json";
import SNAPSHOT from "@/data/field-velocity/neurotech.snapshot.json";
import PROVENANCE from "@/data/field-velocity/neurotech.snapshot.json.provenance.json";
import { parseFeed } from "@/lib/field-velocity/schema";
import { selectPerformance } from "@/lib/field-velocity/performance";
import { PerformanceCurves } from "@/components/performance-curves";

export const metadata: Metadata = { title: "Field velocity — Neuro Atlas" };

const readings = RECORDS.records.filter((row) => row.state === "reading").length;
const unwired = RECORDS.records.filter((row) => row.state === "unwired").length;

export default function FieldVelocityPage() {
  return (
    <>
      <PlateHero
        kicker="Pace"
        meta={["PL R&D metrics"]}
        title="Field velocity"
        description="Metrics that read neurotech's underlying pace: recording capability, mapped tissue and neural data supply, alongside commitments and expectations. Selected source observations, not a live feed or a single global growth rate."
        status="partial"
        stats={[
          { value: String(INSTRUMENTS.instruments.length), label: "metric families" },
          { value: String(readings), label: "families with readings" },
          { value: String(unwired), label: "named, still unwired" },
          { value: String(POINTS.points.length), label: "inflection points" },
        ]}
      />
      <div className="mt-8">
        <VelocityTabs performance={<PerformanceCurves data={selectPerformance(parseFeed(SNAPSHOT))} provenance={PROVENANCE} />} />
      </div>
    </>
  );
}
