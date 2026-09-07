import type { Metadata } from "next";
import { PlateHero } from "@/components/plate-header";
import { EcosystemExplorer } from "@/components/ecosystem-explorer";
import COMPANIES from "@/data/landscape.json";

export const metadata: Metadata = { title: "Ecosystem — Neuro Atlas" };

const categories = new Set(COMPANIES.map((row) => row.category)).size;
const countries = new Set(COMPANIES.map((row) => row.country)).size;
const bci = COMPANIES.filter((row) => row.category === "Brain-Computer Interface").length;

export default function EcosystemPage() {
  return (
    <>
      <PlateHero
        kicker="Landscape"
        meta={["Neurofounders map · scraped 2026-08-24"]}
        title="Ecosystem"
        description="Neurotech companies from the Neurofounders start-up map, faceted by category, funding stage, country, modality, form factor, interface depth, indication, target user, and regulatory stage."
        status="live"
        stats={[
          { value: String(COMPANIES.length), label: "companies" },
          { value: String(categories), label: "categories" },
          { value: String(countries), label: "countries" },
          { value: String(bci), label: "tagged BCI" },
        ]}
      />
      <div className="mt-8">
        <EcosystemExplorer />
      </div>
    </>
  );
}
