"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const TABS: { href: string; label: string }[] = [
  { href: "/milestones", label: "Milestones" },
  { href: "/field-velocity", label: "Field velocity" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/policy", label: "Policy" },
];

function BrandMark() {
  return (
    <Link href="/" className="px-3">
      <span className="text-xl font-semibold tracking-tight">Neuro Atlas</span>
    </Link>
  );
}

/* eslint-disable @next/next/no-img-element */
function PoweredBy() {
  return (
    <div className="mt-3 px-3">
      <div className="mb-2 text-[9px] font-medium uppercase tracking-wider text-faint">powered by</div>
      <div className="flex flex-col gap-2">
        <a href="https://www.plneuro.xyz" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted transition-colors hover:text-foreground">
          <img src="/powered-plneuro.svg" alt="PL Neuro" className="h-6 w-6" />
          <span className="text-[12px] font-medium">PL Neuro</span>
        </a>
        <a href="https://neurotechnology.substack.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted transition-colors hover:text-foreground">
          <img src="/powered-neurotechfutures.png" alt="Neurotech Futures" className="h-6 w-6 rounded-[4px]" />
          <span className="text-[12px] font-medium">Neurotech Futures</span>
        </a>
      </div>
    </div>
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
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2 pr-3">
          <BrandMark />
          <ThemeToggle />
        </div>
        <PoweredBy />
      </div>
      <nav className="flex flex-1 flex-col px-2">
        <div className="flex flex-col gap-0.5">
          {TABS.map((t) => (
            <VItem key={t.href} tab={t} active={pathname === t.href} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

// Mobile top bar (below lg): brand + theme toggle, then a horizontal scroll nav.
export function MobileBar() {
  const pathname = usePathname();
  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between px-1 py-3">
        <BrandMark />
        <ThemeToggle />
      </div>
      <nav className="overflow-x-auto px-3 pb-2">
        <div className="flex min-w-max items-center gap-1">
          {TABS.map((t) => (
            <HItem key={t.href} tab={t} active={pathname === t.href} />
          ))}
        </div>
      </nav>
    </div>
  );
}
