"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The atlas plates. Methodology is structurally different (how the atlas is
// made, not a plate of it), so it sits apart: pinned at the bottom of the
// vertical nav, after a divider in the horizontal fallback.
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
];
const METHODOLOGY = { href: "/methodology", label: "Methodology" };

function StatusDot({ status }: { status?: "live" | "partial" | "planned" }) {
  if (status === "planned") return <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-border-strong" aria-label="planned" />;
  if (status === "partial") return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning/70" aria-label="partial" />;
  if (status === "live") return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-positive" aria-label="live" />;
  return null;
}

function Item({
  tab,
  active,
  vertical,
}: {
  tab: { href: string; label: string; status?: "live" | "partial" | "planned" };
  active: boolean;
  vertical: boolean;
}) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
        vertical ? "w-full rounded-lg px-3 py-1.5" : "rounded-full px-3 py-1.5"
      } ${active ? "bg-foreground text-background" : "text-muted hover:bg-surface hover:text-foreground"}`}
    >
      {vertical ? (
        <>
          <span className="flex-1">{tab.label}</span>
          {!active && <StatusDot status={tab.status} />}
        </>
      ) : (
        <>
          {tab.label}
          {!active && <StatusDot status={tab.status} />}
        </>
      )}
    </Link>
  );
}

// Vertical sidebar (lg+): plates top-to-bottom, Methodology pinned at the bottom.
export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-[calc(100vh-0rem)] max-h-screen w-44 shrink-0 flex-col self-start py-10 lg:flex">
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {TABS.map((t) => (
          <Item key={t.href} tab={t} active={pathname === t.href} vertical />
        ))}
        <div className="mt-auto pt-4">
          <div className="mb-1 border-t border-border" />
          <Item tab={METHODOLOGY} active={pathname === METHODOLOGY.href} vertical />
        </div>
      </nav>
    </aside>
  );
}

// Horizontal fallback for small screens (the sidebar doesn't fit).
export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md lg:hidden">
      <div className="mx-auto w-full max-w-6xl overflow-x-auto px-4 sm:px-6">
        <div className="flex min-w-max items-center gap-1 py-1.5">
          {TABS.map((t) => (
            <Item key={t.href} tab={t} active={pathname === t.href} vertical={false} />
          ))}
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <Item tab={METHODOLOGY} active={pathname === METHODOLOGY.href} vertical={false} />
        </div>
      </div>
    </nav>
  );
}
