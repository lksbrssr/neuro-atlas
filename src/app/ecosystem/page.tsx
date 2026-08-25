import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { EcosystemTabs } from "@/components/sections/ecosystem-tabs";

export const metadata: Metadata = { title: "Ecosystem — Neuro Atlas" };

export default function EcosystemPage() {
  return (
    <>
      <PlateHeader
        title="Ecosystem"
        question="Who is building — and who is funding?"
        status="live"
        description="363 neurotech companies from the Neurofounders start-up map (scraped 2026-08-24), faceted by category, funding stage, country, modality, form factor, interface depth, indication, target user, and regulatory stage. Plus the other side of the ledger — the capital providers."
      />
      <EcosystemTabs />
    </>
  );
}
