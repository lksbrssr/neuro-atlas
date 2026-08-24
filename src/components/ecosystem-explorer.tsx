"use client";

// Ecosystem explorer. Filters use the same expand-inline pill pattern as the
// Progress legend: each facet is a group pill that opens into its option pills
// (one open at a time, ✕ to collapse). Below a divider, companies slot into
// bubble-clusters grouped by a chosen dimension; changing the grouping re-slots
// the dots, filters remove non-matches, hover names a company, click opens it.

import { useMemo, useState } from "react";
import COMPANIES from "@/data/landscape.json";

type Company = (typeof COMPANIES)[number];

const FACETS = [
  { key: "category", label: "Category" },
  { key: "fundingStage", label: "Funding stage" },
  { key: "country", label: "Country" },
  { key: "modality", label: "Modality" },
  { key: "interfaceDepth", label: "Interface depth" },
  { key: "regulatoryStage", label: "Regulatory stage" },
] as const;
type FacetKey = (typeof FACETS)[number]["key"];

const GROUP_BY = [
  { key: "category", label: "Category" },
  { key: "country", label: "Country" },
  { key: "modality", label: "Modality" },
  { key: "fundingStage", label: "Funding stage" },
] as const;
type GroupKey = (typeof GROUP_BY)[number]["key"];

// Cool, cohesive palette cycled across clusters.
const PALETTE = [
  "#22b8cf", "#4c6ef5", "#9775fa", "#12b886", "#4dabf7", "#748ffc",
  "#3bc9db", "#5c7cfa", "#9c88ff", "#20c997", "#66d9e8", "#845ef7",
];

export function EcosystemExplorer() {
  const [sel, setSel] = useState<Record<FacetKey, Set<string>>>(
    () => Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) as Record<FacetKey, Set<string>>,
  );
  const [openFacet, setOpenFacet] = useState<FacetKey | null>(null);
  const [groupBy, setGroupBy] = useState<GroupKey>("category");
  const [tip, setTip] = useState<{ c: Company; x: number; y: number } | null>(null);

  const matches = (c: Company, skip?: FacetKey) =>
    FACETS.every((f) => {
      if (f.key === skip) return true;
      const s = sel[f.key];
      return s.size === 0 || s.has(String(c[f.key] ?? ""));
    });

  const results = useMemo(() => COMPANIES.filter((c) => matches(c)), [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const facetOptions = useMemo(() => {
    const out = {} as Record<FacetKey, { value: string; count: number }[]>;
    for (const f of FACETS) {
      const counts = new Map<string, number>();
      for (const c of COMPANIES) {
        if (!matches(c, f.key)) continue;
        const v = String(c[f.key] ?? "").trim();
        if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      out[f.key] = [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    }
    return out;
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const clusters = useMemo(() => {
    const m = new Map<string, Company[]>();
    for (const c of results) {
      const k = String(c[groupBy] ?? "—").trim() || "—";
      (m.get(k) ?? m.set(k, []).get(k)!).push(c);
    }
    return [...m.entries()]
      .map(([label, items], i) => ({ label, items, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.items.length - a.items.length)
      .map((cl, i) => ({ ...cl, color: PALETTE[i % PALETTE.length] }));
  }, [results, groupBy]);

  const clickFacet = (key: FacetKey) => {
    if (openFacet !== key) { setOpenFacet(key); return; }
    setSel((v) => ({ ...v, [key]: new Set<string>() })); // second click on open facet clears it
  };
  const toggleOption = (facet: FacetKey, value: string) =>
    setSel((v) => {
      const next = new Set(v[facet]);
      if (next.has(value)) next.delete(value); else next.add(value);
      return { ...v, [facet]: next };
    });
  const clearAll = () =>
    setSel(Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) as Record<FacetKey, Set<string>>);

  const totalSelected = FACETS.reduce((n, f) => n + sel[f.key].size, 0);

  return (
    <div>
      {/* Facet pills; the open facet reveals its options in a panel below */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FACETS.map((f) => {
          const selected = sel[f.key];
          const open = openFacet === f.key;
          const active = selected.size > 0;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => clickFacet(f.key)}
              aria-expanded={open}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                open || active ? "border-border-strong bg-surface-raised" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {f.label}
              {active && <span className="tnum rounded-full bg-accent px-1.5 text-[10px] text-accent-foreground">{selected.size}</span>}
              <span className={`text-[9px] text-faint transition-transform ${open ? "rotate-90" : ""}`} aria-hidden>▸</span>
            </button>
          );
        })}
        {totalSelected > 0 && (
          <button type="button" onClick={clearAll} className="ml-1 text-[11px] font-medium text-accent hover:underline">
            reset
          </button>
        )}
      </div>

      {openFacet && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface-raised p-3">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
            {FACETS.find((f) => f.key === openFacet)!.label}
          </span>
          {facetOptions[openFacet].map((o) => {
            const on = sel[openFacet].has(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggleOption(openFacet, o.value)}
                aria-pressed={on}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all ${
                  on ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:border-border-strong hover:text-foreground"
                }`}
              >
                {o.value}
                <span className="tnum text-faint">{o.count}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setOpenFacet(null)}
            aria-label="Collapse"
            title="Collapse"
            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border border-border text-faint transition-colors hover:border-border-strong hover:text-foreground"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}

      {/* Divider between filters and outputs */}
      <div className="my-5 border-t border-border" />

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Group by</span>
        <div className="inline-flex rounded-full border border-border bg-nav p-0.5">
          {GROUP_BY.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroupBy(g.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                groupBy === g.key ? "bg-foreground text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <span className="tnum ml-auto text-xs text-muted">
          {results.length} of {COMPANIES.length} companies
          {totalSelected > 0 && (
            <button type="button" onClick={clearAll} className="ml-2 font-medium text-accent hover:underline">reset</button>
          )}
        </span>
      </div>

      {/* Bubble clusters */}
      <div className="flex flex-wrap gap-4">
        {clusters.map((cl) => (
          <div
            key={cl.label}
            className="flex min-w-[180px] max-w-full flex-col rounded-2xl border border-border p-4"
            style={{ background: `${cl.color}0f` }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: cl.color }} />
              <span className="truncate text-[13px] font-semibold">{cl.label}</span>
              <span className="tnum ml-auto text-[11px] font-medium text-muted">{cl.items.length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cl.items.map((c) => (
                <a
                  key={c.slug}
                  href={c.website ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setTip({ c, x: r.left + r.width / 2, y: r.top - 6 });
                  }}
                  onMouseLeave={() => setTip(null)}
                  className="h-5 w-5 rounded-full ring-1 ring-inset ring-black/10 transition-transform hover:scale-[1.35] hover:ring-2"
                  style={{ background: cl.color, opacity: 0.85 }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {tip && (
        <div className="pointer-events-none fixed z-50 w-56 -translate-x-1/2 -translate-y-full rounded-xl bg-foreground p-3 shadow-2xl" style={{ left: tip.x, top: tip.y }}>
          <div className="text-[13px] font-semibold text-background">{tip.c.name}</div>
          <div className="mt-0.5 text-[11px] text-background/70">{tip.c.country} · {tip.c.category}</div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="rounded-full bg-background/15 px-1.5 py-0.5 text-[10px] font-medium text-background/90">{tip.c.fundingStage}</span>
            {tip.c.modality && <span className="rounded-full bg-background/15 px-1.5 py-0.5 text-[10px] font-medium text-background/90">{tip.c.modality}</span>}
          </div>
          {tip.c.website && <div className="mt-1.5 text-[10px] font-medium text-background/50">click to visit ↗</div>}
        </div>
      )}
    </div>
  );
}
