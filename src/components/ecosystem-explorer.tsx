"use client";

// Ecosystem explorer. Bubbles are company logos. Group-by (a toggle) along the
// top: none → sortable tiles (load more); Category / Modality / Funding stage →
// logos packed into labelled clusters; Country → labelled markers on a world
// map. Clicking a country zooms to its continent and opens a persistent,
// scrollable panel of that country's companies. Filters slide out on the right.
// Acronyms (e.g. modality codes) carry hover tooltips.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import COMPANIES from "@/data/landscape.json";
import { FirmLogo } from "@/components/firm-logo";
import { AutoAbbr } from "@/components/abbr";

type Company = (typeof COMPANIES)[number];

const FACETS = [
  { key: "category", label: "Category" },
  { key: "fundingStage", label: "Funding stage" },
  { key: "country", label: "Country" },
  { key: "modality", label: "Modality" },
  { key: "formFactor", label: "Form factor" },
  { key: "interfaceDepth", label: "Interface depth" },
  { key: "indication", label: "Indication" },
  { key: "targetUser", label: "Target user" },
  { key: "regulatoryStage", label: "Regulatory stage" },
] as const;
type FacetKey = (typeof FACETS)[number]["key"];

const GROUPS = [
  { key: "category", label: "Category" },
  { key: "country", label: "Country" },
  { key: "modality", label: "Modality" },
  { key: "formFactor", label: "Form factor" },
  { key: "indication", label: "Indication" },
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

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function groupColor(v: string): string {
  return `hsl(${185 + (hashCode(v) % 100)} 68% 60%)`;
}

const BALL = 20;
const CELL = 24;
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
  const [hoverCountry, setHoverCountry] = useState<string | null>(null);
  const [lockedCountry, setLockedCountry] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [tip, setTip] = useState<{ c: Company; x: number; y: number } | null>(null);
  const [sortBy, setSortBy] = useState<"az" | "newest" | "oldest">("az");
  const [visibleCount, setVisibleCount] = useState(60);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Drag-to-pan state (kept in a ref so panning doesn't re-render every frame).
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, left: 0, top: 0 });
  // Fraction of the map to re-center on after a zoom change (applied post-layout).
  const pendingCenter = useRef<{ fx: number; fy: number } | null>(null);

  // Keep the map centered on the same point when zooming in/out.
  const zoomTo = (next: number) => {
    const el = scrollRef.current;
    if (el && el.scrollWidth > 0) {
      pendingCenter.current = {
        fx: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        fy: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      };
    }
    setMapZoom(next);
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const pc = pendingCenter.current;
    if (!el || !pc) return;
    el.scrollLeft = pc.fx * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = pc.fy * el.scrollHeight - el.clientHeight / 2;
    pendingCenter.current = null;
  }, [mapZoom]);

  const onMapDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startY: e.clientY, left: el.scrollLeft, top: el.scrollTop };
  };
  const onMapMove = (e: React.MouseEvent) => {
    const d = drag.current, el = scrollRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > 4) d.moved = true;
    if (d.moved) {
      el.scrollLeft = d.left - dx;
      el.scrollTop = d.top - dy;
      setHoverCountry(null);
      setTip(null);
    }
  };
  const endMapDrag = () => { drag.current.active = false; };
  // Swallow the click that ends a real drag so it doesn't lock a country.
  const onMapClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) { e.stopPropagation(); e.preventDefault(); drag.current.moved = false; }
  };

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

  // Single animated canvas for every grouped view — one ball per company, keyed
  // by slug, so switching groupings (incl. to Country) floats them to new spots.
  const graph = useMemo(() => {
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
      const cols = Math.max(3, Math.min(16, Math.ceil(Math.sqrt(items.length) * 1.7)));
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

  // Country → world map of bubble piles. Each country is a tight pile at its
  // centroid; hover fans it into a neat grid (click locks it open + panel).
  // Positions are precomputed so hover just swaps transforms (smooth animation).
  const pileView = useMemo(() => {
    if (groupBy !== "country") return null;
    const baseW = Math.max(width, 320);
    const W = Math.round(baseW * mapZoom);
    const H = Math.round(W * 0.5);
    const baseH = Math.round(baseW * 0.5);
    const proj = (cc: [number, number]) => ({ x: ((cc[1] + 180) / 360) * W, y: ((90 - cc[0]) / 180) * H });
    const byCountry = new Map<string, Company[]>();
    for (const c of results) (byCountry.get(c.country) ?? byCountry.set(c.country, []).get(c.country)!).push(c);

    type Pt = { x: number; y: number };
    type Pile = { country: string; items: Company[]; cx: number; cy: number; ox: number; oy: number; color: string; piled: Pt[]; fanned: Pt[]; fanBox: { left: number; top: number; w: number; h: number } };
    const piles: Pile[] = [];
    for (const [country, items] of byCountry) {
      const cen = CENTROID[country]; const p = cen ? proj(cen) : { x: W - 40, y: 30 };
      piles.push({ country, items, cx: p.x, cy: p.y, ox: p.x, oy: p.y, color: groupColor(country), piled: [], fanned: [], fanBox: { left: 0, top: 0, w: 0, h: 0 } });
    }
    const minD = 46;
    for (let it = 0; it < 80; it++) {
      for (let i = 0; i < piles.length; i++)
        for (let j = i + 1; j < piles.length; j++) {
          const a = piles[i], b = piles[j];
          const dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy) || 0.01;
          if (d < minD) { const push = (minD - d) / 2, ux = dx / d, uy = dy / d; a.cx -= ux * push; a.cy -= uy * push; b.cx += ux * push; b.cy += uy * push; }
        }
      for (const p of piles) { p.cx += (p.ox - p.cx) * 0.05; p.cy += (p.oy - p.cy) * 0.05; }
    }
    for (const p of piles) { p.cx = Math.min(Math.max(p.cx, 24), W - 24); p.cy = Math.min(Math.max(p.cy, 24), H - 24); }

    const CELLF = 26;
    for (const p of piles) {
      const n = p.items.length;
      p.piled = p.items.map((_, i) => {
        const a = i * 2.399963267, r = 1.8 * Math.sqrt(i);
        return { x: p.cx + Math.cos(a) * r - BALL / 2, y: p.cy + Math.sin(a) * r - BALL / 2 };
      });
      const cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.4)));
      const rows = Math.ceil(n / cols);
      const gw = cols * CELLF, gh = rows * CELLF;
      let ox = p.cx - gw / 2, oy = p.cy - gh / 2;
      ox = Math.min(Math.max(ox, 4), Math.max(4, W - gw - 4));
      oy = Math.min(Math.max(oy, 20), Math.max(20, H - gh - 4));
      p.fanBox = { left: ox, top: oy, w: gw, h: gh };
      p.fanned = p.items.map((_, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        return { x: ox + col * CELLF + (CELLF - BALL) / 2, y: oy + row * CELLF + (CELLF - BALL) / 2 };
      });
    }
    piles.sort((a, b) => b.items.length - a.items.length);
    return { piles, W, H, baseH };
  }, [results, groupBy, width, mapZoom]);

  const activeItems = useMemo(
    () => (lockedCountry ? results.filter((c) => c.country === lockedCountry).sort((a, b) => a.name.localeCompare(b.name)) : []),
    [results, lockedCountry],
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
  const setGroup = (g: GroupKey) => { setGroupBy(g); setHoverCountry(null); setLockedCountry(null); setMapZoom(1); };

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

        {/* Clusters (Category / Modality / Form factor / Indication / Funding) → animated balls */}
        {graph && (
          <div className="relative" style={{ height: graph.totalH }}>
            {graph.labels.map((l) => (
              <div key={l.text} className="pointer-events-none absolute z-20 flex items-center gap-1.5" style={{ left: l.x, top: l.y }}>
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[11px] font-semibold"><AutoAbbr text={l.text} /></span>
                <span className="tnum text-[10px] text-faint">{l.count}</span>
              </div>
            ))}
            {results.map((c) => {
              const p = graph.positions.get(c.slug);
              if (!p) return null;
              return (
                <button key={c.slug} type="button" onClick={() => { if (c.website) window.open(c.website, "_blank"); }}
                  onMouseEnter={(e) => showTip(e, c)} onMouseLeave={() => setTip(null)} aria-label={c.name}
                  className="absolute transition-transform duration-700 ease-out hover:z-30"
                  style={{ left: 0, top: 0, transform: `translate(${p.x}px, ${p.y}px)`, zIndex: 5 }}>
                  <span className="block transition-transform duration-150 hover:scale-150"><Bubble c={c} size={BALL} /></span>
                </button>
              );
            })}
          </div>
        )}

        {/* Country → world map of bubble piles; hover fans them out, click locks + panel */}
        {pileView && (
          <div className="relative rounded-xl border border-border" style={{ height: pileView.baseH }}>
            <div ref={scrollRef} className={`absolute inset-0 overflow-auto rounded-xl ${mapZoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
              onMouseLeave={() => { setHoverCountry(null); endMapDrag(); }}
              onMouseDown={onMapDown} onMouseMove={onMapMove} onMouseUp={endMapDrag} onClickCapture={onMapClickCapture}>
              <div className="relative" style={{ width: pileView.W, height: pileView.H }}>
                <div className="pointer-events-none absolute inset-0" aria-hidden style={{ backgroundImage: "url(/worldmap.svg)", backgroundRepeat: "no-repeat", backgroundSize: `${pileView.W}px ${pileView.H}px`, backgroundPosition: "0 0", opacity: 0.2 }} />

            {pileView.piles.map((p) => {
              const fanned = hoverCountry === p.country || lockedCountry === p.country;
              const locked = lockedCountry === p.country;
              return (
                <div key={p.country} className="absolute left-0 top-0" style={{ zIndex: fanned ? 40 : 10 }}
                  onMouseEnter={() => setHoverCountry(p.country)}
                  onMouseLeave={() => { if (lockedCountry !== p.country) setHoverCountry((h) => (h === p.country ? null : h)); }}
                  onClick={() => setLockedCountry((l) => (l === p.country ? null : p.country))}>

                  {fanned && (
                    <div className="absolute rounded-xl border border-border bg-surface/80 shadow-md backdrop-blur-sm"
                      style={{ left: p.fanBox.left - 8, top: p.fanBox.top - 20, width: p.fanBox.w + 16, height: p.fanBox.h + 28 }} />
                  )}

                  <div className="absolute -translate-x-1/2 whitespace-nowrap"
                    style={fanned ? { left: p.fanBox.left + p.fanBox.w / 2, top: p.fanBox.top - 16 } : { left: p.cx, top: p.cy + 15 }}>
                    <span className="rounded-full bg-surface/90 px-1.5 py-0.5 text-[10px] font-semibold shadow-sm">
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: p.color }} />
                      {p.country} <span className="tnum text-faint">{p.items.length}</span>
                      {locked && <span className="ml-1 font-normal text-faint">· click to close</span>}
                    </span>
                  </div>

                  {p.items.map((c, i) => {
                    const pos = fanned ? p.fanned[i] : p.piled[i];
                    return (
                      <button key={c.slug} type="button"
                        onClick={(e) => { e.stopPropagation(); if (fanned) { if (c.website) window.open(c.website, "_blank"); } else { setLockedCountry(p.country); } }}
                        onMouseEnter={(e) => showTip(e, c)} onMouseLeave={() => setTip(null)} aria-label={c.name}
                        className="absolute left-0 top-0 transition-transform duration-500 ease-out hover:z-50"
                        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
                        <span className="block transition-transform duration-150 hover:scale-125"><Bubble c={c} size={BALL} /></span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
              </div>
            </div>

            <div className="absolute left-2 top-2 z-40 flex flex-col overflow-hidden rounded-lg border border-border-strong bg-surface/95 shadow-sm backdrop-blur">
              <button type="button" aria-label="Zoom in" onClick={() => zoomTo(Math.min(4, +(mapZoom * 1.4).toFixed(2)))} className="px-2.5 py-1 text-sm font-semibold leading-none hover:bg-surface-raised">+</button>
              <button type="button" aria-label="Zoom out" onClick={() => zoomTo(Math.max(1, +(mapZoom / 1.4).toFixed(2)))} className="border-t border-border px-2.5 py-1.5 text-sm font-semibold leading-none hover:bg-surface-raised">−</button>
            </div>
            {mapZoom > 1 && (
              <button type="button" onClick={() => zoomTo(1)} className="absolute left-11 top-2 z-40 rounded-full border border-border-strong bg-surface/95 px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur hover:bg-surface-raised">reset · {mapZoom}×</button>
            )}

            {lockedCountry && (
              <div className="absolute right-2 top-2 z-50 flex max-h-[calc(100%-1rem)] w-72 max-w-[calc(100%-1rem)] flex-col rounded-xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: groupColor(lockedCountry) }} />
                    <span className="text-[13px] font-semibold">{lockedCountry}</span>
                    <span className="tnum text-[11px] text-faint">{activeItems.length}</span>
                  </div>
                  <button type="button" onClick={() => setLockedCountry(null)} aria-label="Close" className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-faint hover:text-foreground">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                  {activeItems.map((c) => (
                    <a key={c.slug} href={c.website ?? undefined} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-raised">
                      <Bubble c={c} size={24} />
                      <div className="min-w-0">
                        <div className="truncate text-[12px] font-medium">{c.name}</div>
                        <div className="truncate text-[10px] text-muted">{c.category}{c.modality ? <> · <AutoAbbr text={c.modality} /></> : ""}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-surface/80 px-2 py-0.5 text-[10px] text-faint">drag to pan · hover a pile to fan it out · click to lock &amp; explore · +/− to zoom</div>
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
