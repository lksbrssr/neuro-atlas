"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const TABS: { href: string; label: string }[] = [
  { href: "/", label: "Overview" },
  { href: "/capital", label: "Capital" },
  { href: "/velocity", label: "Velocity" },
  { href: "/deployment", label: "Deployment" },
  { href: "/policy", label: "Policy" },
];
const METHODOLOGY = { href: "/methodology", label: "Methodology" };

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h4l3-8 4 16 3-8h6" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Neuro Atlas</span>
    </Link>
  );
}

function VItem({ tab, active }: { tab: { href: string; label: string }; active: boolean }) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center rounded-lg px-3 py-2 text-[15px] font-medium transition-colors ${
        active
          ? "bg-surface text-foreground shadow-sm"
          : "text-muted hover:bg-surface/60 hover:text-foreground"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" aria-hidden />
      )}
      {tab.label}
    </Link>
  );
}

function HItem({ tab, active }: { tab: { href: string; label: string }; active: boolean }) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
      }`}
    >
      {tab.label}
    </Link>
  );
}

// Vertical sidebar (lg+): brand top, nav in the grey chrome, Methodology below a
// divider, theme toggle pinned at the bottom. The active item is the white pill.
export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col py-5 lg:flex">
      <div className="mb-6 flex items-center justify-between gap-2 pr-3">
        <BrandMark />
        <ThemeToggle />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {TABS.map((t) => (
          <VItem key={t.href} tab={t} active={pathname === t.href} />
        ))}
        <div className="mx-3 my-2 border-t border-border" />
        <VItem tab={METHODOLOGY} active={pathname === METHODOLOGY.href} />
      </nav>
    </aside>
  );
}

// Mobile top bar (below lg): brand + theme toggle, then a horizontal scroll nav.
export function MobileBar() {
  const pathname = usePathname();
  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <BrandMark />
        <ThemeToggle />
      </div>
      <nav className="overflow-x-auto px-3 pb-2">
        <div className="flex min-w-max items-center gap-1">
          {TABS.map((t) => (
            <HItem key={t.href} tab={t} active={pathname === t.href} />
          ))}
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <HItem tab={METHODOLOGY} active={pathname === METHODOLOGY.href} />
        </div>
      </nav>
    </div>
  );
}
