"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The atlas plates. Methodology is structurally different (how the atlas is
// made, not a plate of it), so it sits apart: after a divider at the bottom of
// the nav.
const TABS: { href: string; label: string; status?: "live" | "partial" | "planned" }[] = [
  { href: "/", label: "Overview" },
  { href: "/capital", label: "Capital", status: "partial" },
  { href: "/velocity", label: "Velocity", status: "live" },
  { href: "/deployment", label: "Deployment", status: "partial" },
  { href: "/policy", label: "Policy", status: "partial" },
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
      className={`relative flex items-center gap-2 font-medium transition-colors ${
        vertical
          ? "w-full rounded-lg px-3 py-2 text-[15px]"
          : "rounded-full px-3 py-1.5 text-sm"
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

// Vertical sidebar (lg+): a distinct grey panel, all items always visible
// (no scroll), Methodology pinned below a divider.
export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-6 hidden h-fit w-52 shrink-0 self-start lg:block">
      <nav className="flex flex-col gap-1 rounded-2xl border border-nav-border bg-nav p-2">
        {TABS.map((t) => (
          <Item key={t.href} tab={t} active={pathname === t.href} vertical />
        ))}
        <div className="my-1 border-t border-nav-border" />
        <Item tab={METHODOLOGY} active={pathname === METHODOLOGY.href} vertical />
      </nav>
    </aside>
  );
}

// Horizontal fallback for small screens (the sidebar doesn't fit).
export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-nav-border bg-nav lg:hidden">
      <div className="mx-auto w-full max-w-[88rem] overflow-x-auto px-4 sm:px-6">
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
