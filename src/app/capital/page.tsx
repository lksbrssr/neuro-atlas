import type { Metadata } from "next";
import { CapitalPlate } from "@/components/plates/capital-plate";

export const metadata: Metadata = { title: "Capital — Neuro Atlas" };

export default function CapitalPage() {
  return <CapitalPlate />;
}
