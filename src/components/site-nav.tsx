"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string; status?: "live" | "partial" | "planned" }[] = [
  { href: "/", label: "Overview" },
  { href: "/milestones", label: "Milestones", status: "live" },
  { href: "/landscape", label: "Landscape", status: "live" },
  { href: "/velocity", label: "Velocity", status: "live" },
  { href: "/capital", label: "Capital", status: "partial" },
  { href: "/pipeline", label: "Pipeline", status: "partial" },
  { href: "/geopolitics", label: "Geopolitics", status: "partial" },
  { href: "/expectations", label: "Expectations", status: "partial" },
  { href: "/people", label: "People", status: "planned" },
  { href: "/access", label: "Access", status: "planned" },
  { href: "/methodology", label: "Methodology" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl overflow-x-auto px-4 sm:px-6">
        <div className="flex min-w-max gap-1 py-1.5">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {t.label}
                {t.status === "planned" && !active && (
                  <span className="h-1.5 w-1.5 rounded-full border border-border-strong" aria-label="planned" />
                )}
                {t.status === "partial" && !active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-warning/70" aria-label="partial" />
                )}
                {t.status === "live" && !active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-positive" aria-label="live" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
