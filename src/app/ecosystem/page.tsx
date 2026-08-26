import type { Metadata } from "next";
import { PlateHeader } from "@/components/plate-header";
import { EcosystemExplorer } from "@/components/ecosystem-explorer";

export const metadata: Metadata = { title: "Ecosystem — Neuro Atlas" };

export default function EcosystemPage() {
  return (
    <>
      <PlateHeader
        title="Ecosystem"
        question="Who is building?"
        status="live"
        description="363 neurotech companies from the Neurofounders start-up map (scraped 2026-08-24) — search by name, filter by nine facets, and rank the field by category, geography, modality, or funding stage."
      />
      <EcosystemExplorer />
      <p className="mt-10 max-w-[72ch] border-t border-border pt-4 text-micro leading-relaxed text-faint">
        Coming next: the capital providers — the other side of the ledger. Private rounds by
        stage, government &amp; grant funding, investor composition, and a market-size
        reconciliation. Tracked in the methodology, shipped when the data is real.
      </p>
    </>
  );
}
