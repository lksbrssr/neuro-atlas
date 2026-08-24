"use client";

// In-plate sub-navigation. A grouped plate (e.g. Capital) holds several
// dashboards; this switches between them. All panes stay mounted (`hidden`) so
// filter/timeline state is preserved when you switch away and back.

import { useState, type ReactNode } from "react";

export function SubTabs({
  tabs,
}: {
  tabs: { key: string; label: string; node: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0].key);
  return (
    <>
      <div className="mb-6 inline-flex rounded-full border border-border bg-nav p-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            aria-current={active === t.key ? "true" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === t.key
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} hidden={t.key !== active}>
          {t.node}
        </div>
      ))}
    </>
  );
}
