import { redirect } from "next/navigation";
import { NEUROFOUNDERS_MAP_URL } from "@/lib/ecosystem";

// Preserve existing bookmarks without hosting a copy of the directory.
export default function EcosystemPage() {
  redirect(NEUROFOUNDERS_MAP_URL);
}
