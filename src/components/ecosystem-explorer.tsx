"use client";

// Ecosystem explorer. Group-by along the top: with no grouping you get large
// tiles; pick a grouping and the tiles become small bubbles that rearrange
// (animated) into clusters — or, for Country, scatter across a world map by
// geography. Filters live in a right-hand slide-out drawer and cover every
// facet except the one you've grouped by. Snapshot (companies in view, median
// founding year) sits up top.

import { useEffect, useMemo, useRef, useState } from "react";
import COMPANIES from "@/data/landscape.json";
import { FirmLogo } from "@/components/firm-logo";

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

const GROUPS = [
  { key: "none", label: "No grouping" },
  { key: "category", label: "Category" },
  { key: "country", label: "Country" },
  { key: "modality", label: "Modality" },
  { key: "fundingStage", label: "Funding stage" },
] as const;
type GroupKey = (typeof GROUPS)[number]["key"];

// Approx country centroids (lat, lng) for the countries in the dataset.
const CENTROID: Record<string, [number, number]> = {
  USA: [39.8, -98.6], UK: [54, -2.4], Switzerland: [46.8, 8.2], France: [46.6, 2.2],
  Israel: [31.4, 35], Canada: [56, -106], China: [35.9, 104], Australia: [-25, 133],
  Belgium: [50.6, 4.6], Netherlands: [52.2, 5.6], Germany: [51.2, 10.4], Spain: [40.2, -3.7],
  India: [22, 78.9], Denmark: [56, 9.5], Finland: [64, 26], Ireland: [53.2, -8],
  Italy: [42.8, 12.8], Poland: [52, 19.4], Austria: [47.6, 14.1], Sweden: [62, 15],
  "South-Korea": [36.5, 127.9], Hungary: [47.2, 19.5], Slovenia: [46.1, 14.8], Taiwan: [23.7, 121],
  Singapore: [1.35, 103.8], Argentina: [-38.4, -63.6], "Hong Kong": [22.3, 114.2], Lithuania: [55.2, 23.9],
  Japan: [36.2, 138.3], Czechia: [49.8, 15.5], Turkey: [39, 35.2], "New Zealand": [-41, 174],
};

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
// Cohesive cool palette: hue 185–285 (cyan → blue → violet).
function groupColor(v: string): string {
  return `hsl(${185 + (hashCode(v) % 100)} 68% 60%)`;
}

const BALL = 18;
const CELL = 23;
const LABEL_H = 24;

export function EcosystemExplorer() {
  const [sel, setSel] = useState<Record<FacetKey, Set<string>>>(
    () => Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) as Record<FacetKey, Set<string>>,
  );
  const [groupBy, setGroupBy] = useState<GroupKey>("none");
  const [panelOpen, setPanelOpen] = useState(false);
  const [openFacet, setOpenFacet] = useState<FacetKey | null>("category");
  const [width, setWidth] = useState(900);
  const [tip, setTip] = useState<{ c: Company; x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

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

  const snapshot = useMemo(() => {
    const founded = results.map((c) => c.founded).filter((y): y is number => y != null).sort((a, b) => a - b);
    return { count: results.length, medianFounded: founded.length ? founded[Math.floor(founded.length / 2)] : null };
  }, [results]);

  // Layout: slug -> {x,y,color}, plus cluster labels and total height.
  const layout = useMemo(() => {
    const W = Math.max(width, 320);
    const positions = new Map<string, { x: number; y: number; color: string }>();
    const labels: { text: string; color: string; x: number; y: number; count: number }[] = [];

    if (groupBy === "country") {
      const H = Math.round(W / 2);
      for (const c of results) {
        const cen = CENTROID[c.country];
        const color = groupColor(c.country);
        if (!cen) { positions.set(c.slug, { x: W - 24, y: 12, color }); continue; }
        const bx = ((cen[1] + 180) / 360) * W;
        const by = ((90 - cen[0]) / 180) * H;
        const hh = hashCode(c.slug);
        const r = (hh % 22);
        const a = (hh % 360) * (Math.PI / 180);
        positions.set(c.slug, { x: bx + Math.cos(a) * r - BALL / 2, y: by + Math.sin(a) * r - BALL / 2, color });
      }
      return { positions, labels, totalH: H, map: true };
    }

    // Cluster groupings
    const groups = new Map<string, Company[]>();
    for (const c of results) {
      const k = String(c[groupBy as FacetKey] ?? "—").trim() || "—";
      (groups.get(k) ?? groups.set(k, []).get(k)!).push(c);
    }
    const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

    let x = 0, y = 0, rowH = 0;
    const PADX = 10, GAPX = 22, GAPY = 26;
    for (const [label, items] of ordered) {
      const color = groupColor(label);
      const cols = Math.max(3, Math.min(16, Math.ceil(Math.sqrt(items.length) * 1.7)));
      const cw = cols * CELL + PADX * 2;
      const rows = Math.ceil(items.length / cols);
      const ch = LABEL_H + rows * CELL + 8;
      if (x > 0 && x + cw > W) { x = 0; y += rowH + GAPY; rowH = 0; }
      labels.push({ text: label, color, x, y, count: items.length });
      items.forEach((c, i) => {
        positions.set(c.slug, { x: x + PADX + (i % cols) * CELL, y: y + LABEL_H + Math.floor(i / cols) * CELL, color });
      });
      x += cw + GAPX;
      rowH = Math.max(rowH, ch);
    }
    return { positions, labels, totalH: y + rowH, map: false };
  }, [results, groupBy, width]);

  const toggleOption = (facet: FacetKey, value: string) =>
    setSel((v) => {
      const next = new Set(v[facet]);
      if (next.has(value)) next.delete(value); else next.add(value);
      return { ...v, [facet]: next };
    });
  const clearAll = () => setSel(Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) as Record<FacetKey, Set<string>>);
  const totalSelected = FACETS.reduce((n, f) => n + sel[f.key].size, 0);
  const visibleFacets = FACETS.filter((f) => groupBy === "none" || f.key !== groupBy);

  return (
    <div className="relative">
      {/* Snapshot + group-by + filters toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-1.5">
          <span className="tnum text-2xl font-semibold">{snapshot.count}</span>
          <span className="text-[11px] text-muted">companies in view</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="tnum text-2xl font-semibold">{snapshot.medianFounded ?? "—"}</span>
          <span className="text-[11px] text-muted">median founding year</span>
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-raised"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M6 12h12M10 18h4" /></svg>
          Filters
          {totalSelected > 0 && <span className="tnum rounded-full bg-accent px-1.5 text-[10px] text-accent-foreground">{totalSelected}</span>}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-1.5 border-b border-border pb-4">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-faint">Group by</span>
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGroupBy(g.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              groupBy === g.key ? "bg-foreground text-background" : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="relative">
        {groupBy === "none" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.slice(0, 60).map((c) => (
              <a key={c.slug} href={c.website ?? undefined} target="_blank" rel="noreferrer" className="card flex items-start gap-3 p-4 transition-transform hover:-translate-y-0.5">
                <FirmLogo src={c.logoUrl} name={c.name} size={32} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold">{c.name}</div>
                  <div className="truncate text-[11px] text-muted">{c.country} · {c.category}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">{c.fundingStage}</span>
                    {c.modality && <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted">{c.modality}</span>}
                  </div>
                </div>
              </a>
            ))}
            {results.length > 60 && (
              <div className="col-span-full text-center text-xs text-faint">Showing 60 of {results.length} — filter or pick a grouping to see them all as bubbles.</div>
            )}
          </div>
        ) : (
          <div className="relative" style={{ height: layout.totalH }}>
            {layout.map && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/worldmap.svg" alt="" aria-hidden className="pointer-events-none absolute left-0 top-0 select-none" style={{ width: "100%", height: layout.totalH, opacity: 0.16 }} />
            )}
            {layout.labels.map((l) => (
              <div key={l.text} className="absolute flex items-center gap-1.5" style={{ left: l.x, top: l.y, transform: "none" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[11px] font-semibold">{l.text}</span>
                <span className="tnum text-[10px] text-faint">{l.count}</span>
              </div>
            ))}
            {results.map((c) => {
              const p = layout.positions.get(c.slug);
              if (!p) return null;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => { if (c.website) window.open(c.website, "_blank"); }}
                  onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTip({ c, x: r.left + r.width / 2, y: r.top - 6 }); }}
                  onMouseLeave={() => setTip(null)}
                  aria-label={c.name}
                  className="absolute rounded-full ring-1 ring-inset ring-black/10 transition-[transform,opacity] duration-500 ease-out hover:z-20 hover:ring-2"
                  style={{ left: 0, top: 0, width: BALL, height: BALL, background: p.color, transform: `translate(${p.x}px, ${p.y}px)` }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-out filter drawer */}
      {panelOpen && <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setPanelOpen(false)} aria-hidden />}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-out ${panelOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Filters</span>
          <div className="flex items-center gap-3">
            {totalSelected > 0 && <button type="button" onClick={clearAll} className="text-[11px] font-medium text-accent hover:underline">reset</button>}
            <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close filters" className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted hover:text-foreground">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {groupBy !== "none" && (
            <p className="mb-3 text-[11px] leading-relaxed text-faint">
              Grouped by <span className="font-medium text-muted">{GROUPS.find((g) => g.key === groupBy)!.label}</span> — filter by any other facet.
            </p>
          )}
          <div className="space-y-4">
            {visibleFacets.map((f) => {
              const open = openFacet === f.key;
              return (
                <div key={f.key} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                  <button type="button" onClick={() => setOpenFacet(open ? null : f.key)} className="flex w-full items-center justify-between text-left text-[13px] font-semibold">
                    {f.label}
                    <span className="text-faint">{open ? "−" : "+"}</span>
                  </button>
                  {open && (
                    <ul className="mt-2 space-y-1">
                      {facetOptions[f.key].map((o) => (
                        <li key={o.value}>
                          <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-[13px] hover:bg-surface-raised">
                            <input type="checkbox" checked={sel[f.key].has(o.value)} onChange={() => toggleOption(f.key, o.value)} className="h-3.5 w-3.5 accent-[var(--accent)]" />
                            <span className="flex-1 truncate">{o.value}</span>
                            <span className="tnum text-[11px] text-faint">{o.count}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Tooltip */}
      {tip && (
        <div className="pointer-events-none fixed z-[60] w-56 -translate-x-1/2 -translate-y-full rounded-xl bg-foreground p-3 shadow-2xl" style={{ left: tip.x, top: tip.y }}>
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
