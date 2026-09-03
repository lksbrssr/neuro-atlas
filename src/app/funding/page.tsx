import type { Metadata } from "next";
import fundingData from "@/data/funding-index.json";
import { FundingIndexDashboard } from "@/components/funding-index-dashboard";
import type { FundingIndexData } from "@/lib/funding-index";

export const metadata: Metadata = {
  title: "BCI Funding Index · Neuro Atlas",
  description: "A screened view of BCI financing rounds, investors, and regulatory milestones.",
};

export default function FundingPage() {
  return <FundingIndexDashboard data={fundingData as FundingIndexData} />;
}
