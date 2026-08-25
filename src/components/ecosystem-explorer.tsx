"use client";

// Ecosystem explorer. Bubbles are company logos. Group-by (a toggle) along the
// top: none → sortable tiles (load more); Category / Modality / Funding stage →
// logos packed into labelled clusters; Country → labelled markers on a world
// map. Clicking a country zooms to its continent and opens a persistent,
// scrollable panel of that country's companies. Filters slide out on the right.
// Acronyms (e.g. modality codes) carry hover tooltips.

import { useEffect, useMemo, useRef, useState } from "react";
import COMPANIES from "@/data/landscape.json";
import { FirmLogo } from "@/components/firm-logo";
import { AutoAbbr } from "@/components/abbr";

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
  { key: "category", label: "Category" },
  { key: "country", label: "Country" },
  { key: "modality", label: "Modality" },
  { key: "fundingStage", label: "Funding stage" },
] as const;
type GroupKey = "none" | (typeof GROUPS)[number]["key"];

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

const CONTINENTS: Record<string, { label: string; lng: [number, number]; lat: [number, number]; countries: string[] }> = {
  "north-america": { label: "North America", lng: [-140, -60], lat: [25, 70], countries: ["USA", "Canada"] },
  "south-america": { label: "South America", lng: [-85, -40], lat: [-52, -22], countries: ["Argentina"] },
  europe: { label: "Europe & Middle East", lng: [-12, 42], lat: [30, 64], countries: ["UK", "Switzerland", "France", "Germany", "Belgium", "Netherlands", "Spain", "Denmark", "Finland", "Ireland", "Italy", "Poland", "Austria", "Sweden", "Hungary", "Slovenia", "Lithuania", "Czechia", "Israel", "Turkey"] },
  asia: { label: "Asia", lng: [70, 145], lat: [0, 45], countries: ["China", "India", "Japan", "South-Korea", "Taiwan", "Hong Kong", "Singapore"] },
  oceania: { label: "Oceania", lng: [110, 180], lat: [-48, -8], countries: ["Australia", "New Zealand"] },
};
const COUNTRY_CONTINENT: Record<string, string> = Object.fromEntries(
  Object.entries(CONTINENTS).flatMap(([k, v]) => v.countries.map((c) => [c, k])),
);

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function groupColor(v: string): string {
  return `hsl(${185 + (hashCode(v) % 100)} 68% 60%)`;
}

const BALL = 24;
const CELL = 28;
const LABEL_H = 24;

function Bubble({ c, size }: { c: Company; size: number }) {
  return (
    <span className="block overflow-hidden rounded-full bg-surface ring-1 ring-inset ring-black/10" style={{ width: size, height: size }}>
      <FirmLogo src={c.logoUrl} name={c.name} size={size} />
    </span>
  );
}

export function EcosystemExplorer() {
  const [sel, setSel] = useState<Record<FacetKey, Set<string>>>(
    () => Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) as Record<FacetKey, Set<string>>,
  );
  const [groupBy, setGroupBy] = useState<GroupKey>("none");
  const [panelOpen, setPanelOpen] = useState(false);
  const [openFacet, setOpenFacet] = useState<FacetKey | null>("category");
  const [width, setWidth] = useState(900);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [tip, setTip] = useState<{ c: Company; x: number; y: number } | null>(null);
  const [sortBy, setSortBy] = useState<"az" | "newest" | "oldest">("az");
  const [visibleCount, setVisibleCount] = useState(60);
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

  const sortedResults = useMemo(() => {
    const arr = [...results];
    if (sortBy === "az") arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "newest") arr.sort((a, b) => (b.founded ?? -Infinity) - (a.founded ?? -Infinity));
    else arr.sort((a, b) => (a.founded ?? Infinity) - (b.founded ?? Infinity));
    return arr;
  }, [results, sortBy]);

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

  const mapLayout = useMemo(() => {
    if (groupBy !== "country") return null;
    const W = Math.max(width, 320);
    const z = activeCountry ? CONTINENTS[COUNTRY_CONTINENT[activeCountry]] : null;
    const lngMin = z ? z.lng[0] : -180, lngMax = z ? z.lng[1] : 180;
    const latMax = z ? z.lat[1] : 90;
    const lngRange = lngMax - lngMin, latRange = z ? z.lat[1] - z.lat[0] : 180;
    const H = Math.round(W * (z ? latRange / lngRange : 0.5));
    const groups = new Map<string, Company[]>();
    for (const c of results) (groups.get(c.country) ?? groups.set(c.country, []).get(c.country)!).push(c);
    let marks = [...groups.entries()].map(([country, items]) => {
      const cen = CENTROID[country];
      const ox = cen ? ((cen[1] - lngMin) / lngRange) * W : W - 42;
      const oy = cen ? ((latMax - cen[0]) / latRange) * H : 20;
      return { country, items, x: ox, y: oy, ox, oy, color: groupColor(country) };
    });
    if (z) marks = marks.filter((m) => z.countries.includes(m.country));
    const minD = z ? 64 : 50;
    for (let it = 0; it < 70; it++) {
      for (let i = 0; i < marks.length; i++)
        for (let j = i + 1; j < marks.length; j++) {
          const a = marks[i], b = marks[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.01;
          if (d < minD) { const push = (minD - d) / 2, ux = dx / d, uy = dy / d; a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push; }
        }
      for (const m of marks) { m.x += (m.ox - m.x) * 0.05; m.y += (m.oy - m.y) * 0.05; }
    }
    for (const m of marks) { m.x = Math.min(Math.max(m.x, 44), W - 44); m.y = Math.min(Math.max(m.y, 16), H - 16); }
    const imgW = z ? (W * 360) / lngRange : W;
    const imgH = z ? imgW / 2 : H;
    const imgLeft = z ? -((lngMin + 180) / 360) * imgW : 0;
    const imgTop = z ? -((90 - latMax) / 180) * imgH : 0;
    return { marks, H, img: { width: imgW, height: imgH, left: imgLeft, top: imgTop }, zoomed: !!z };
  }, [results, groupBy, width, activeCountry]);

  const clusterLayout = useMemo(() => {
    if (groupBy === "none" || groupBy === "country") return null;
    const W = Math.max(width, 320);
    const positions = new Map<string, { x: number; y: number }>();
    const labels: { text: string; color: string; x: number; y: number; count: number }[] = [];
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
      const cols = Math.max(3, Math.min(14, Math.ceil(Math.sqrt(items.length) * 1.6)));
      const cw = cols * CELL + PADX * 2;
      const rows = Math.ceil(items.length / cols);
      const ch = LABEL_H + rows * CELL + 8;
      if (x > 0 && x + cw > W) { x = 0; y += rowH + GAPY; rowH = 0; }
      labels.push({ text: label, color, x, y, count: items.length });
      items.forEach((c, i) => positions.set(c.slug, { x: x + PADX + (i % cols) * CELL, y: y + LABEL_H + Math.floor(i / cols) * CELL }));
      x += cw + GAPX;
      rowH = Math.max(rowH, ch);
    }
    return { positions, labels, totalH: y + rowH };
  }, [results, groupBy, width]);

  const activeItems = useMemo(
    () => (activeCountry ? results.filter((c) => c.country === activeCountry).sort((a, b) => a.name.localeCompare(b.name)) : []),
    [results, activeCountry],
  );

  const toggleOption = (facet: FacetKey, value: string) =>
    setSel((v) => {
      const next = new Set(v[facet]);
      if (next.has(value)) next.delete(value); else next.add(value);
      return { ...v, [facet]: next };
    });
  const clearAll = () => setSel(Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) as Record<FacetKey, Set<string>>);
  const totalSelected = FACETS.reduce((n, f) => n + sel[f.key].size, 0);
  const visibleFacets = FACETS.filter((f) => groupBy === "none" || f.key !== groupBy);
  const setGroup = (g: GroupKey) => { setGroupBy(g); setActiveCountry(null); };

  const showTip = (e: React.MouseEvent<HTMLElement>, c: Company) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ c, x: r.left + r.width / 2, y: r.top - 6 });
  };

  return (
    <div className="relative">
      {/* Snapshot + filters toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-1.5">
          <span className="tnum text-2xl font-semibold">{snapshot.count}</span>
          <span className="text-[11px] text-muted">companies in view</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="tnum text-2xl font-semibold">{snapshot.medianFounded ?? "—"}</span>
          <span className="text-[11px] text-muted">median founding year</span>
        </div>
        <button type="button" onClick={() => setPanelOpen(true)} className="ml-auto flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-surface-raised">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M6 12h12M10 18h4" /></svg>
          Filters
          {totalSelected > 0 && <span className="tnum rounded-full bg-accent px-1.5 text-[10px] text-accent-foreground">{totalSelected}</span>}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-1.5 border-b border-border pb-4">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-faint">Group by</span>
        {GROUPS.map((g) => (
          <button key={g.key} type="button" onClick={() => setGroup(groupBy === g.key ? "none" : g.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${groupBy === g.key ? "bg-foreground text-background" : "border border-border text-muted hover:text-foreground"}`}>
            {g.label}
          </button>
        ))}
        {groupBy !== "none" && (
          <button type="button" onClick={() => setGroup("none")} className="ml-1 text-[11px] font-medium text-accent hover:underline">clear</button>
        )}
        {groupBy === "none" && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium">
              <option value="az">A–Z</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        )}
      </div>

      <div ref={canvasRef} className="relative">
        {/* No grouping → sortable tiles + load more */}
        {groupBy === "none" && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sortedResults.slice(0, visibleCount).map((c) => (
                <a key={c.slug} href={c.website ?? undefined} target="_blank" rel="noreferrer" className="card flex items-start gap-3 p-4 transition-transform hover:-translate-y-0.5">
                  <FirmLogo src={c.logoUrl} name={c.name} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold">{c.name}</div>
                    <div className="truncate text-[11px] text-muted">{c.country} · {c.category}{c.founded ? ` · ${c.founded}` : ""}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">{c.fundingStage}</span>
                      {c.modality && <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted"><AutoAbbr text={c.modality} /></span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {sortedResults.length > visibleCount && (
              <div className="mt-6 text-center">
                <button type="button" onClick={() => setVisibleCount((v) => v + 60)} className="rounded-full border border-border-strong px-4 py-2 text-xs font-medium hover:bg-surface-raised">
                  Load more ({sortedResults.length - visibleCount} more)
                </button>
              </div>
            )}
          </>
        )}

        {/* Country → world map, zoom on click, persistent company panel */}
        {groupBy === "country" && mapLayout && (
          <div className="relative overflow-hidden rounded-xl" style={{ height: mapLayout.H }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/worldmap.svg" alt="" aria-hidden className="pointer-events-none absolute select-none" style={{ width: mapLayout.img.width, height: mapLayout.img.height, left: mapLayout.img.left, top: mapLayout.img.top, opacity: 0.16 }} />
            {mapLayout.zoomed && (
              <button type="button" onClick={() => setActiveCountry(null)} className="absolute left-2 top-2 z-30 flex items-center gap-1 rounded-full border border-border-strong bg-surface/95 px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur hover:bg-surface-raised">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                World
              </button>
            )}
            {mapLayout.marks.map((m) => {
              const active = activeCountry === m.country;
              return (
                <button key={m.country} type="button" onClick={() => setActiveCountry(m.country)}
                  className="absolute" style={{ left: m.x, top: m.y, transform: "translate(-50%,-50%)", zIndex: active ? 30 : 10 }}>
                  <span className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 shadow-sm backdrop-blur transition-transform hover:scale-105 ${active ? "bg-surface ring-2" : "bg-surface/95"}`} style={{ borderColor: m.color, ...(active ? { boxShadow: `0 0 0 2px ${m.color}` } : {}) }}>
                    <Bubble c={m.items[0]} size={15} />
                    <span className="whitespace-nowrap text-[10px] font-semibold">{m.country}</span>
                    <span className="tnum text-[10px] text-faint">{m.items.length}</span>
                  </span>
                </button>
              );
            })}

            {/* Persistent, scrollable country panel */}
            {activeCountry && (
              <div className="absolute right-2 top-2 z-40 flex max-h-[calc(100%-1rem)] w-72 max-w-[calc(100%-1rem)] flex-col rounded-xl border border-border bg-surface shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: groupColor(activeCountry) }} />
                    <span className="text-[13px] font-semibold">{activeCountry}</span>
                    <span className="tnum text-[11px] text-faint">{activeItems.length}</span>
                  </div>
                  <button type="button" onClick={() => setActiveCountry(null)} aria-label="Close" className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-faint hover:text-foreground">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                  {activeItems.map((c) => (
                    <a key={c.slug} href={c.website ?? undefined} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-raised">
                      <Bubble c={c} size={22} />
                      <div className="min-w-0">
                        <div className="truncate text-[12px] font-medium">{c.name}</div>
                        <div className="truncate text-[10px] text-muted">{c.category}{c.modality ? <> · <AutoAbbr text={c.modality} /></> : ""}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category / Modality / Funding → logo clusters */}
        {clusterLayout && (
          <div className="relative" style={{ height: clusterLayout.totalH }}>
            {clusterLayout.labels.map((l) => (
              <div key={l.text} className="absolute flex items-center gap-1.5" style={{ left: l.x, top: l.y }}>
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[11px] font-semibold"><AutoAbbr text={l.text} /></span>
                <span className="tnum text-[10px] text-faint">{l.count}</span>
              </div>
            ))}
            {results.map((c) => {
              const p = clusterLayout.positions.get(c.slug);
              if (!p) return null;
              return (
                <button key={c.slug} type="button" onClick={() => { if (c.website) window.open(c.website, "_blank"); }}
                  onMouseEnter={(e) => showTip(e, c)} onMouseLeave={() => setTip(null)} aria-label={c.name}
                  className="absolute transition-[transform] duration-500 ease-out hover:z-20"
                  style={{ left: 0, top: 0, transform: `translate(${p.x}px, ${p.y}px)` }}>
                  <span className="block transition-transform duration-150 hover:scale-125"><Bubble c={c} size={BALL} /></span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-out filter drawer */}
      {panelOpen && <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setPanelOpen(false)} aria-hidden />}
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-out ${panelOpen ? "translate-x-0" : "translate-x-full"}`}>
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
              Grouped by <span className="font-medium text-muted">{GROUPS.find((g) => g.key === groupBy)?.label}</span> — filter by any other facet.
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
                            <span className="flex-1 truncate">{f.key === "modality" ? <AutoAbbr text={o.value} /> : o.value}</span>
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

      {/* Bubble hover tooltip */}
      {tip && (
        <div className="pointer-events-none fixed z-[70] w-56 -translate-x-1/2 -translate-y-full rounded-xl bg-foreground p-3 shadow-2xl" style={{ left: tip.x, top: tip.y }}>
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
