import type { Metadata } from "next";
import { VelocityPlate } from "@/components/plates/velocity-plate";

export const metadata: Metadata = { title: "Velocity — Neuro Atlas" };

export default function VelocityPage() {
  return <VelocityPlate />;
}
