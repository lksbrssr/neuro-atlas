"use client";

// Ecosystem explorer. One search field + persistent facet filters (left column
// at lg+, drawer below) over 363 companies. Views: "All companies" is a
// sortable card directory with infinite scroll; grouping by a facet renders a
// ranked bar breakdown (count-encoded, comparable) with the company grid as a
// drill-down when a group is selected. Geography defaults to the same ranked
// breakdown; an opt-in map (lg+ only) shows size-encoded country marks with a
// region selector — no free pan/zoom, no logo piles.

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
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
type GroupKey = (typeof GROUPS)[number]["key"];
type View = "all" | GroupKey;

// Maturity order for the default sort and the "Series A+" stat.
const STAGE_RANK: Record<string, number> = {
  Public: 10,
  Acquired: 9,
  "Series C+": 8,
  "Series B": 7,
  "Series A": 6,
  Seed: 5,
  "Pre-seed": 4,
  "Non-dilutive": 3,
  Bootstrapped: 2,
  Unknown: 1,
  Defunct: 0,
};
const SERIES_A_PLUS = new Set(["Series A", "Series B", "Series C+", "Public", "Acquired"]);

const SORTS = [
  { key: "stage", label: "Latest stage" },
  { key: "newest", label: "Newest founded" },
  { key: "oldest", label: "Oldest founded" },
  { key: "az", label: "A–Z" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const PAGE = 60;

function facetMatch(c: Company, sel: Record<FacetKey, Set<string>>, skip?: FacetKey) {
  return FACETS.every((f) => {
    if (f.key === skip) return true;
    const s = sel[f.key];
    return s.size === 0 || s.has(String(c[f.key] ?? ""));
  });
}

function queryMatch(c: Company, q: string) {
  if (!q) return true;
  return (
    c.name.toLowerCase().includes(q) ||
    c.tags.some((t) => t.toLowerCase().includes(q)) ||
    (c.indication ?? "").toLowerCase().includes(q) ||
    (c.category ?? "").toLowerCase().includes(q) ||
    (c.country ?? "").toLowerCase().includes(q)
  );
}

// ── Map data (opt-in geography view) ──────────────────────────────────────────
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

const REGIONS = [
  { key: "world", label: "World", lng: [-170, 185] as const, lat: [-56, 78] as const },
  { key: "americas", label: "Americas", lng: [-135, -25] as const, lat: [-58, 66] as const },
  { key: "europe", label: "Europe & Middle East", lng: [-14, 40] as const, lat: [28, 66] as const },
  { key: "apac", label: "Asia-Pacific", lng: [55, 185] as const, lat: [-50, 58] as const },
] as const;
type RegionKey = (typeof REGIONS)[number]["key"];

function CountryMap({
  counts,
  selected,
  onSelect,
}: {
  counts: [string, number][];
  selected: string | null;
  onSelect: (country: string) => void;
}) {
  const [region, setRegion] = useState<RegionKey>("world");
  const [width, setWidth] = useState(960);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const r = REGIONS.find((x) => x.key === region)!;
  const lngSpan = r.lng[1] - r.lng[0];
  const latSpan = r.lat[1] - r.lat[0];
  const H = Math.round((width * latSpan) / lngSpan);
  // Equirectangular background crop: the world SVG is 2:1 (360°×180°).
  const bgW = (width * 360) / lngSpan;
  const bgH = bgW / 2;
  const bgX = -((r.lng[0] + 180) / 360) * bgW;
  const bgY = -((90 - r.lat[1]) / 180) * bgH;

  const marks = useMemo(() => {
    type Mark = { country: string; count: number; x: number; y: number; d: number };
    const out: Mark[] = [];
    for (const [country, count] of counts) {
      const cen = CENTROID[country];
      if (!cen) continue;
      const [lat, lng] = cen;
      if (lng < r.lng[0] || lng > r.lng[1] || lat < r.lat[0] || lat > r.lat[1]) continue;
      const x = ((lng - r.lng[0]) / lngSpan) * width;
      const y = ((r.lat[1] - lat) / latSpan) * H;
      const d = Math.max(26, Math.min(56, 14 + Math.sqrt(count) * 5)); // ≥24px targets
      out.push({ country, count, x, y, d });
    }
    // Relax collisions so marks never fully overlap.
    for (let it = 0; it < 120; it++) {
      for (let i = 0; i < out.length; i++)
        for (let j = i + 1; j < out.length; j++) {
          const a = out[i], b = out[j];
          const min = (a.d + b.d) / 2 + 3;
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.01;
          if (dist < min) {
            const push = (min - dist) / 2, ux = dx / dist, uy = dy / dist;
            a.x -= ux * push; a.y -= uy * push;
            b.x += ux * push; b.y += uy * push;
          }
        }
    }
    for (const m of out) {
      m.x = Math.min(Math.max(m.x, m.d / 2 + 2), width - m.d / 2 - 2);
      m.y = Math.min(Math.max(m.y, m.d / 2 + 2), H - m.d / 2 - 2);
    }
    return out;
  }, [counts, width, H, lngSpan, latSpan, r]);

  const labelThreshold = region === "world" ? 10 : 1;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {REGIONS.map((reg) => (
          <button
            key={reg.key}
            type="button"
            onClick={() => setRegion(reg.key)}
            aria-pressed={region === reg.key}
            className={`rounded-full px-3 py-1 text-micro font-medium transition-colors ${
              region === reg.key ? "bg-foreground text-background" : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {reg.label}
          </button>
        ))}
      </div>
      <div ref={ref} className="relative overflow-hidden rounded-xl border border-border" style={{ height: H }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-25 dark:opacity-40 dark:invert"
          aria-hidden
          style={{
            backgroundImage: "url(/worldmap.svg)",
            backgroundRepeat: "no-repeat",
            backgroundSize: `${bgW}px ${bgH}px`,
            backgroundPosition: `${bgX}px ${bgY}px`,
          }}
        />
        {marks.map((m) => {
          const isSel = selected === m.country;
          return (
            <button
              key={m.country}
              type="button"
              onClick={() => onSelect(m.country)}
              aria-pressed={isSel}
              aria-label={`${m.country} — ${m.count} ${m.count === 1 ? "company" : "companies"}`}
              title={`${m.country} — ${m.count}`}
              className={`tnum absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-micro font-semibold transition-colors ${
                isSel
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-accent bg-surface/90 text-foreground hover:bg-accent-soft"
              }`}
              style={{ left: m.x, top: m.y, width: m.d, height: m.d }}
            >
              {m.count}
            </button>
          );
        })}
        {marks
          .filter((m) => m.count >= labelThreshold)
          .map((m) => (
            <span
              key={`label-${m.country}`}
              className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-surface/85 px-1.5 text-micro font-medium text-muted"
              style={{ left: m.x, top: m.y + m.d / 2 + 3 }}
              aria-hidden
            >
              {m.country}
            </span>
          ))}
      </div>
      <p className="mt-1.5 text-micro text-faint">Mark size = company count. Click a country to see its companies.</p>
    </div>
  );
}

// ── Facet checklist (shared by the lg+ column and the small-screen drawer) ────
function FacetList({
  facets,
  facetOptions,
  sel,
  toggleOption,
  openFacet,
  setOpenFacet,
}: {
  facets: readonly { key: FacetKey; label: string }[];
  facetOptions: Record<FacetKey, { value: string; count: number }[]>;
  sel: Record<FacetKey, Set<string>>;
  toggleOption: (f: FacetKey, v: string) => void;
  openFacet: FacetKey | null;
  setOpenFacet: (f: FacetKey | null) => void;
}) {
  return (
    <div className="space-y-3">
      {facets.map((f) => {
        const open = openFacet === f.key;
        const active = sel[f.key].size;
        return (
          <div key={f.key} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
            <button
              type="button"
              onClick={() => setOpenFacet(open ? null : f.key)}
              aria-expanded={open}
              className="flex w-full items-center justify-between text-left text-label font-semibold"
            >
              <span>
                {f.label}
                {active > 0 && <span className="tnum ml-1.5 rounded-full bg-accent-soft px-1.5 text-micro text-accent">{active}</span>}
              </span>
              <span className="text-faint" aria-hidden>{open ? "−" : "+"}</span>
            </button>
            {open && (
              <ul className="mt-2 space-y-0.5">
                {facetOptions[f.key].map((o) => (
                  <li key={o.value}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-label hover:bg-surface-raised">
                      <input
                        type="checkbox"
                        checked={sel[f.key].has(o.value)}
                        onChange={() => toggleOption(f.key, o.value)}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      <span className="flex-1 truncate">{f.key === "modality" ? <AutoAbbr text={o.value} /> : o.value}</span>
                      <span className="tnum text-micro text-faint">{o.count}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompanyCard({ c }: { c: Company }) {
  return (
    <a
      key={c.slug}
      href={c.website ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="card flex items-start gap-3 p-4 transition-colors hover:border-border-strong"
    >
      <FirmLogo src={c.logoUrl} name={c.name} size={36} />
      <div className="min-w-0">
        <div className="truncate text-label font-semibold">{c.name}</div>
        <div className="tnum truncate text-micro text-muted">
          {c.country} · {c.category}
          {c.founded ? ` · ${c.founded}` : ""}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-micro font-medium text-accent">{c.fundingStage}</span>
          {c.indication && <span className="rounded-full border border-border px-1.5 py-0.5 text-micro text-muted">{c.indication}</span>}
          {c.regulatoryStage && <span className="rounded-full border border-border px-1.5 py-0.5 text-micro text-muted">{c.regulatoryStage}</span>}
        </div>
      </div>
    </a>
  );
}

export function EcosystemExplorer() {
  const [sel, setSel] = useState<Record<FacetKey, Set<string>>>(
    () => Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) as Record<FacetKey, Set<string>>,
  );
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [view, setView] = useState<View>("all");
  const [drill, setDrill] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("stage");
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const [panelOpen, setPanelOpen] = useState(false);
  const [openFacet, setOpenFacet] = useState<FacetKey | null>("category");
  const [showMap, setShowMap] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const q = deferredQuery.trim().toLowerCase();

  const results = useMemo(() => COMPANIES.filter((c) => facetMatch(c, sel) && queryMatch(c, q)), [sel, q]);

  const facetOptions = useMemo(() => {
    const out = {} as Record<FacetKey, { value: string; count: number }[]>;
    for (const f of FACETS) {
      const counts = new Map<string, number>();
      for (const c of COMPANIES) {
        if (!facetMatch(c, sel, f.key) || !queryMatch(c, q)) continue;
        const v = String(c[f.key] ?? "").trim();
        if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      out[f.key] = [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    }
    return out;
  }, [sel, q]);

  // Header stats: answer "who is building — and how mature is it?"
  const stats = useMemo(() => {
    const countries = new Set(results.map((c) => c.country)).size;
    const aPlus = results.filter((c) => SERIES_A_PLUS.has(c.fundingStage)).length;
    return {
      count: results.length,
      countries,
      aPlusShare: results.length ? Math.round((aPlus / results.length) * 100) : 0,
    };
  }, [results]);

  // Grouped breakdown for the active view.
  const groups = useMemo(() => {
    if (view === "all") return null;
    const map = new Map<string, number>();
    for (const c of results) {
      const v = String(c[view] ?? "—").trim() || "—";
      map.set(v, (map.get(v) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [results, view]);

  const gridItems = useMemo(() => {
    const base = view !== "all" && drill ? results.filter((c) => String(c[view] ?? "—").trim() === drill) : results;
    const arr = [...base];
    if (sortBy === "az") arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "newest") arr.sort((a, b) => (b.founded ?? -Infinity) - (a.founded ?? -Infinity) || a.name.localeCompare(b.name));
    else if (sortBy === "oldest") arr.sort((a, b) => (a.founded ?? Infinity) - (b.founded ?? Infinity) || a.name.localeCompare(b.name));
    else arr.sort((a, b) => (STAGE_RANK[b.fundingStage] ?? 0) - (STAGE_RANK[a.fundingStage] ?? 0) || (b.founded ?? 0) - (a.founded ?? 0) || a.name.localeCompare(b.name));
    return arr;
  }, [results, view, drill, sortBy]);

  const showGrid = view === "all" || drill != null;

  // Reset pagination when the result set changes shape (adjust-during-render).
  const resetKey = `${q}|${view}|${drill}|${sortBy}|${FACETS.map((f) => [...sel[f.key]].join(",")).join(";")}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setVisibleCount(PAGE);
  }

  // Infinite scroll (replaces the Load-more button).
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setVisibleCount((v) => v + PAGE);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [showGrid]);

  const toggleOption = (facet: FacetKey, value: string) =>
    setSel((v) => {
      const next = new Set(v[facet]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...v, [facet]: next };
    });
  const clearAll = () => {
    setSel(Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) as Record<FacetKey, Set<string>>);
    setQuery("");
  };
  const totalSelected = FACETS.reduce((n, f) => n + sel[f.key].size, 0);
  const activeChips = FACETS.flatMap((f) => [...sel[f.key]].map((value) => ({ facet: f, value })));
  const visibleFacets = FACETS.filter((f) => view === "all" || f.key !== view);
  const setViewAndReset = (v: View) => {
    setView(v);
    setDrill(null);
    setShowMap(false);
  };

  const facetListProps = { facets: visibleFacets, facetOptions, sel, toggleOption, openFacet, setOpenFacet };

  return (
    <div className="relative">
      {/* Header stats — display type, the page's own answers */}
      <dl className="mb-8 grid grid-cols-3 gap-x-4 border-y border-border sm:gap-x-8">
        {[
          { v: String(stats.count), l: "companies in view" },
          { v: String(stats.countries), l: "countries represented" },
          { v: `${stats.aPlusShare}%`, l: "at Series A or beyond" },
        ].map((s) => (
          <div key={s.l} className="py-4 sm:py-5">
            <dd className="tnum font-display text-3xl sm:text-4xl">{s.v}</dd>
            <dt className="mt-1 text-micro text-muted">{s.l}</dt>
          </div>
        ))}
      </dl>

      {/* Toolbar: search first, then view + sort in one control language */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-3">
        <div className="relative w-full max-w-sm">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies, tags, indications…"
            aria-label="Search companies"
            className="w-full rounded-full border border-border bg-surface py-1.5 pl-9 pr-9 text-label placeholder:text-faint focus:border-border-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-faint hover:bg-surface-raised hover:text-foreground"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
        {query && (
          <span className="tnum text-micro text-muted">
            {results.length} match{results.length === 1 ? "" : "es"}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <label htmlFor="eco-sort" className="text-micro font-semibold uppercase tracking-wider text-faint">
            Sort
          </label>
          <div className="relative">
            <select
              id="eco-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="appearance-none rounded-full border border-border bg-surface py-1.5 pl-3 pr-8 text-label font-medium hover:border-border-strong focus-visible:outline-2 focus-visible:outline-accent"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-label font-medium hover:border-border-strong lg:hidden"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            Filters
            {totalSelected > 0 && <span className="tnum rounded-full bg-accent px-1.5 text-micro text-accent-foreground">{totalSelected}</span>}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-1.5 border-b border-border pb-4">
        <span className="mr-1 text-micro font-semibold uppercase tracking-wider text-faint">View</span>
        <button
          type="button"
          onClick={() => setViewAndReset("all")}
          aria-pressed={view === "all"}
          className={`rounded-full px-3 py-1 text-label font-medium transition-colors ${
            view === "all" ? "bg-foreground text-background" : "border border-border text-muted hover:text-foreground"
          }`}
        >
          All companies
        </button>
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setViewAndReset(view === g.key ? "all" : g.key)}
            aria-pressed={view === g.key}
            className={`rounded-full px-3 py-1 text-label font-medium transition-colors ${
              view === g.key ? "bg-foreground text-background" : "border border-border text-muted hover:text-foreground"
            }`}
          >
            By {g.label.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-10">
        {/* Persistent facet column at lg+ — filter while watching results change */}
        <aside className="sticky top-6 hidden max-h-[calc(100vh-3rem)] w-60 shrink-0 overflow-y-auto pb-6 pr-1 lg:block">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-micro font-semibold uppercase tracking-wider text-faint">Filters</span>
            {totalSelected > 0 && (
              <button type="button" onClick={clearAll} className="text-micro font-medium text-accent hover:underline">
                reset
              </button>
            )}
          </div>
          <FacetList {...facetListProps} />
        </aside>

        <div className="min-w-0 flex-1">
          {/* Active filters as removable chips */}
          {activeChips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {activeChips.map(({ facet, value }) => (
                <button
                  key={`${facet.key}-${value}`}
                  type="button"
                  onClick={() => toggleOption(facet.key, value)}
                  className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-micro font-medium text-accent hover:opacity-80"
                  aria-label={`Remove filter ${facet.label}: ${value}`}
                >
                  <span className="text-accent/70">{facet.label}:</span> {value}
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              ))}
              <button type="button" onClick={clearAll} className="ml-1 text-micro font-medium text-muted hover:text-foreground">
                clear all
              </button>
            </div>
          )}

          {/* Ranked breakdown for grouped views */}
          {view !== "all" && groups && (
            <div className="mb-8">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h3 className="text-label font-semibold">
                  {GROUPS.find((g) => g.key === view)?.label} — ranked by company count
                </h3>
                {view === "country" && (
                  <button
                    type="button"
                    onClick={() => setShowMap((m) => !m)}
                    aria-pressed={showMap}
                    className={`hidden rounded-full border px-2.5 py-0.5 text-micro font-medium lg:inline-block ${
                      showMap ? "border-border-strong bg-surface-raised" : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {showMap ? "Hide map" : "Show map"}
                  </button>
                )}
              </div>

              {view === "country" && showMap && (
                <div className="mb-6 hidden lg:block">
                  <CountryMap counts={groups} selected={drill} onSelect={(c) => setDrill((d) => (d === c ? null : c))} />
                </div>
              )}

              <ul className="space-y-1">
                {groups.map(([value, count]) => {
                  const max = groups[0][1];
                  const active = drill === value;
                  return (
                    <li key={value}>
                      <button
                        type="button"
                        onClick={() => setDrill((d) => (d === value ? null : value))}
                        aria-pressed={active}
                        className={`group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-raised ${active ? "bg-surface-raised" : ""}`}
                      >
                        <span className={`w-44 truncate text-label sm:w-56 ${active ? "font-semibold" : ""}`}>
                          {view === "modality" ? <AutoAbbr text={value} /> : value}
                        </span>
                        <span className="relative h-3.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border/50">
                          <span
                            className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width]"
                            style={{ width: `${(count / max) * 100}%`, opacity: active ? 1 : 0.75 }}
                          />
                        </span>
                        <span className="tnum w-10 shrink-0 text-right text-label font-medium">{count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {!drill && <p className="mt-3 text-micro text-faint">Select a group to see its companies.</p>}
            </div>
          )}

          {/* Company grid (directory, or drill-down of the selected group) */}
          {showGrid && (
            <>
              {view !== "all" && drill && (
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-label font-semibold">
                    {drill} <span className="tnum font-normal text-muted">· {gridItems.length} companies</span>
                  </h3>
                  <button type="button" onClick={() => setDrill(null)} className="text-micro font-medium text-accent hover:underline">
                    back to all groups
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {gridItems.slice(0, visibleCount).map((c) => (
                  <CompanyCard key={c.slug} c={c} />
                ))}
              </div>
              <div ref={sentinelRef} aria-hidden />
              <p className="tnum mt-4 text-center text-micro text-faint">
                {gridItems.length === 0
                  ? "No companies match — clear a filter or the search."
                  : `Showing ${Math.min(visibleCount, gridItems.length)} of ${gridItems.length}`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Slide-out filter drawer (small screens only) */}
      {panelOpen && <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setPanelOpen(false)} aria-hidden />}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!panelOpen}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-label font-semibold">Filters</span>
          <div className="flex items-center gap-3">
            {totalSelected > 0 && (
              <button type="button" onClick={clearAll} className="text-micro font-medium text-accent hover:underline">
                reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Close filters"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <FacetList {...facetListProps} />
        </div>
      </aside>
    </div>
  );
}
