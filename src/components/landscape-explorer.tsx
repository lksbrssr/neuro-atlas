"use client";

// Shop-style faceted explorer over the Neurofounders landscape (363 companies).
// Left rail of facets → active-filter chips with individual removal → the
// "current dataset profile" recomputes live. Facet counts are computed against
// the results of all *other* facets, so options never dead-end.

import { useMemo, useState } from "react";
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

const FUNDING_ORDER = [
  "Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Public",
  "Acquired", "Bootstrapped", "Non-dilutive", "Grant-funded", "Unknown", "Defunct",
];

const DISPLAY_CAP = 48;

export function LandscapeExplorer() {
  const [sel, setSel] = useState<Record<FacetKey, Set<string>>>(
    () => Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) as Record<FacetKey, Set<string>>,
  );
  const [open, setOpen] = useState<Record<FacetKey, boolean>>(
    () =>
      Object.fromEntries(FACETS.map((f, i) => [f.key, i < 3])) as Record<FacetKey, boolean>,
  );

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
        if (!v) continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      let opts = [...counts.entries()].map(([value, count]) => ({ value, count }));
      if (f.key === "fundingStage") {
        opts.sort((a, b) => FUNDING_ORDER.indexOf(a.value) - FUNDING_ORDER.indexOf(b.value));
      } else {
        opts.sort((a, b) => b.count - a.count);
      }
      if (f.key === "country" || f.key === "modality") opts = opts.slice(0, 14);
      out[f.key] = opts;
    }
    return out;
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeChips = FACETS.flatMap((f) =>
    [...sel[f.key]].map((v) => ({ facet: f.key as FacetKey, facetLabel: f.label, value: v })),
  );

  const toggleValue = (facet: FacetKey, value: string) =>
    setSel((prev) => {
      const next = { ...prev, [facet]: new Set(prev[facet]) };
      if (next[facet].has(value)) next[facet].delete(value);
      else next[facet].add(value);
      return next;
    });

  const clearAll = () =>
    setSel(Object.fromEntries(FACETS.map((f) => [f.key, new Set()])) as Record<FacetKey, Set<string>>);

  // Current dataset profile
  const profile = useMemo(() => {
    const by = (key: FacetKey, top: number) => {
      const m = new Map<string, number>();
      results.forEach((c) => {
        const v = String(c[key] ?? "").trim();
        if (v) m.set(v, (m.get(v) ?? 0) + 1);
      });
      return [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, top)
        .map(([label, value]) => ({ label, value }));
    };
    const founded = results.map((c) => c.founded).filter((y): y is number => y != null).sort((a, b) => a - b);
    return {
      byCategory: by("category", 1),
      medianFounded: founded.length ? founded[Math.floor(founded.length / 2)] : null,
    };
  }, [results]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Facet rail */}
      <aside className="w-full shrink-0 lg:w-60">
        <div className="card sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Filters</h2>
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-medium text-accent hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-4">
            {FACETS.map((f) => (
              <div key={f.key} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [f.key]: !o[f.key] }))}
                  className="flex w-full items-center justify-between text-left text-[13px] font-semibold"
                >
                  {f.label}
                  <span className="text-faint">{open[f.key] ? "−" : "+"}</span>
                </button>
                {open[f.key] && (
                  <ul className="mt-2 space-y-1">
                    {facetOptions[f.key].map((o) => {
                      const checked = sel[f.key].has(o.value);
                      return (
                        <li key={o.value}>
                          <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-[13px] hover:bg-surface-raised">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleValue(f.key, o.value)}
                              className="h-3.5 w-3.5 accent-[var(--accent)]"
                            />
                            <span className="flex-1 truncate">{o.value}</span>
                            <span className="tnum text-[11px] text-faint">{o.count}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Results */}
      <div className="min-w-0 flex-1">
        {/* Active chips */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Filters selected
          </span>
          {activeChips.length === 0 && <span className="text-xs text-faint">none — showing the full field</span>}
          {activeChips.map((c) => (
            <button
              key={`${c.facet}:${c.value}`}
              type="button"
              onClick={() => toggleValue(c.facet, c.value)}
              className="flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-opacity hover:opacity-80"
            >
              {c.facetLabel}: {c.value}
              <span aria-hidden>×</span>
            </button>
          ))}
          {activeChips.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent hover:opacity-80"
            >
              Clear ↺
            </button>
          )}
        </div>

        {/* Current dataset profile */}
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card p-4">
            <div className="tnum text-2xl font-semibold">{results.length}</div>
            <div className="text-[11px] text-muted">companies in view</div>
          </div>
          <div className="card p-4">
            <div className="tnum text-2xl font-semibold">{profile.medianFounded ?? "—"}</div>
            <div className="text-[11px] text-muted">median founding year</div>
          </div>
          <div className="card col-span-2 p-4">
            <div className="truncate text-sm font-semibold">
              {profile.byCategory[0]?.label ?? "—"}
            </div>
            <div className="text-[11px] text-muted">
              largest category in view ({profile.byCategory[0]?.value ?? 0})
            </div>
          </div>
        </div>

        {/* Company grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {results.slice(0, DISPLAY_CAP).map((c) => (
            <a
              key={c.slug}
              href={c.website ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="card flex items-start gap-3 p-4 transition-transform hover:-translate-y-0.5"
            >
              <FirmLogo src={c.logoUrl} name={c.name} size={32} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold">{c.name}</div>
                <div className="truncate text-[11px] text-muted">
                  {c.country} · {c.category}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    {c.fundingStage}
                  </span>
                  {c.modality && (
                    <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted">
                      {c.modality}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
        {results.length > DISPLAY_CAP && (
          <p className="mt-4 text-center text-xs text-faint">
            Showing {DISPLAY_CAP} of {results.length} — refine the filters to narrow the field.
          </p>
        )}
      </div>
    </div>
  );
}
