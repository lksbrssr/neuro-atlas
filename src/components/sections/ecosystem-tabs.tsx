"use client";

import { SubTabs } from "@/components/sub-tabs";
import { EcosystemExplorer } from "@/components/ecosystem-explorer";
import { CapitalProvidersSection } from "@/components/sections/capital-providers-section";

export function EcosystemTabs() {
  return (
    <SubTabs
      tabs={[
        { key: "companies", label: "Companies", node: <EcosystemExplorer /> },
        { key: "capital", label: "Capital providers", node: <CapitalProvidersSection /> },
      ]}
    />
  );
}
