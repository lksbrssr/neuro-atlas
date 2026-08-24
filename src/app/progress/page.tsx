import type { Metadata } from "next";
import { ProgressPlate } from "@/components/plates/progress-plate";

export const metadata: Metadata = { title: "Progress — Neuro Atlas" };

export default function ProgressPage() {
  return <ProgressPlate />;
}
