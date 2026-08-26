"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const TABS: { href: string; label: string }[] = [
  { href: "/milestones", label: "Milestones" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/field-velocity", label: "Field velocity" },
  { href: "/regulatory-landscape", label: "Regulatory landscape" },
];

function NavItem({ tab, active }: { tab: { href: string; label: string }; active: boolean }) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`relative whitespace-nowrap rounded-full px-3 py-1.5 text-label font-medium transition-colors ${
        active ? "bg-surface-raised text-foreground" : "text-muted hover:text-foreground"
      }`}
    >
      {tab.label}
    </Link>
  );
}

// Single top bar at every breakpoint: brand + nav + theme toggle over a
// hairline rule. Below md the nav row scrolls horizontally with an edge fade
// instead of clipping mid-word.
export function SiteHeader() {
  const pathname = usePathname();
  const nav = (
    <div className="flex min-w-max items-center gap-1">
      {TABS.map((t) => (
        <NavItem key={t.href} tab={t} active={pathname === t.href} />
      ))}
    </div>
  );
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-[84rem] items-center gap-6 px-4 py-3 sm:px-8 lg:px-12">
        <Link href="/" className="shrink-0">
          <span className="font-display text-title tracking-tight">Neuro Atlas</span>
        </Link>
        <nav className="hidden flex-1 justify-end md:flex" aria-label="Primary">
          {nav}
        </nav>
        <div className="ml-auto shrink-0 md:ml-0">
          <ThemeToggle />
        </div>
      </div>
      <nav className="scroll-fade-x overflow-x-auto px-4 pb-2 sm:px-8 md:hidden" aria-label="Primary">
        {nav}
      </nav>
    </header>
  );
}

/* eslint-disable @next/next/no-img-element */
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-[84rem] flex-wrap items-center gap-x-8 gap-y-4 px-4 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center gap-5">
          <span className="text-micro font-medium uppercase tracking-wider text-faint">powered by</span>
          <a
            href="https://www.plneuro.xyz"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-muted transition-colors hover:text-foreground"
          >
            <img src="/powered-plneuro.svg" alt="" className="h-5 w-5" />
            <span className="text-micro font-medium">PL Neuro</span>
          </a>
          <a
            href="https://neurotechnology.substack.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-muted transition-colors hover:text-foreground"
          >
            <img src="/powered-neurotechfutures.png" alt="" className="h-5 w-5 rounded-[4px]" />
            <span className="text-micro font-medium">Neurotech Futures</span>
          </a>
        </div>
        <Link href="/methodology" className="ml-auto text-micro font-medium text-muted hover:text-foreground">
          Methodology
        </Link>
      </div>
    </footer>
  );
}
